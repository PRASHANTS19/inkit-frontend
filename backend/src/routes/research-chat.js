import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/research-chat/:caseId
 * Get chat history for a specific case
 */
router.get('/:caseId', async (req, res) => {
    try {
        const { caseId } = req.params;

        const chatHistory = await prisma.researchChatHistory.findFirst({
            where: {
                user_id: req.user.id,
                case_id: caseId,
                mode: 'case'
            },
            orderBy: { updated_date: 'desc' }
        });

        if (!chatHistory) {
            return res.json({ messages: [], selected_docs: [] });
        }

        res.json({
            messages: JSON.parse(chatHistory.messages || '[]'),
            selected_docs: JSON.parse(chatHistory.selected_docs || '[]')
        });
    } catch (error) {
        console.error('Get case chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

/**
 * GET /api/research-chat/research/history
 * Get research mode chat history
 */
router.get('/research/history', async (req, res) => {
    try {
        const chatHistory = await prisma.researchChatHistory.findFirst({
            where: {
                user_id: req.user.id,
                mode: 'research',
                case_id: null
            },
            orderBy: { updated_date: 'desc' }
        });

        if (!chatHistory) {
            return res.json({ messages: [] });
        }

        res.json({
            messages: JSON.parse(chatHistory.messages || '[]')
        });
    } catch (error) {
        console.error('Get research chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
});

/**
 * POST /api/research-chat
 * Send message and get AI response
 * Body: { mode, case_id, selected_documents, message, research_sources }
 */
router.post('/', async (req, res) => {
    try {
        const { mode, case_id, selected_documents = [], message, research_sources = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!mode || !['case', 'research'].includes(mode)) {
            return res.status(400).json({ error: 'Valid mode required (case or research)' });
        }

        // Fetch documents if in case mode
        let documentContexts = [];
        if (mode === 'case' && selected_documents.length > 0) {
            const docs = await prisma.document.findMany({
                where: {
                    id: { in: selected_documents },
                    uploaded_by: req.user.id
                },
                select: {
                    id: true,
                    title: true,
                    extracted_text: true,
                    description: true
                }
            });
            documentContexts = docs;
        }

        // Build AI response
        const aiResponse = await generateAIResponse(mode, message, documentContexts, research_sources);

        // Load or create chat history
        let chatHistory;
        if (mode === 'case') {
            chatHistory = await prisma.researchChatHistory.findFirst({
                where: { user_id: req.user.id, case_id, mode: 'case' }
            });
        } else {
            chatHistory = await prisma.researchChatHistory.findFirst({
                where: { user_id: req.user.id, mode: 'research', case_id: null }
            });
        }

        const messages = chatHistory ? JSON.parse(chatHistory.messages) : [];
        messages.push(
            { role: 'user', content: message, timestamp: new Date().toISOString() },
            {
                role: 'assistant',
                content: aiResponse.answer,
                sources: aiResponse.sources,
                confidence: aiResponse.confidence,
                timestamp: new Date().toISOString()
            }
        );

        // Save chat history
        if (chatHistory) {
            await prisma.researchChatHistory.update({
                where: { id: chatHistory.id },
                data: {
                    messages: JSON.stringify(messages),
                    selected_docs: mode === 'case' ? JSON.stringify(selected_documents) : null
                }
            });
        } else {
            await prisma.researchChatHistory.create({
                data: {
                    user_id: req.user.id,
                    case_id: mode === 'case' ? case_id : null,
                    mode,
                    messages: JSON.stringify(messages),
                    selected_docs: mode === 'case' ? JSON.stringify(selected_documents) : null
                }
            });
        }

        res.json(aiResponse);
    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ error: 'Failed to process message', details: error.message });
    }
});

/**
 * DELETE /api/research-chat/:id
 * Clear chat history
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.researchChatHistory.delete({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        res.json({ message: 'Chat history cleared' });
    } catch (error) {
        console.error('Delete chat history error:', error);
        res.status(500).json({ error: 'Failed to delete chat history' });
    }
});

/**
 * Helper function to generate AI response
 */
async function generateAIResponse(mode, message, documentContexts, researchSources) {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key') {
        // Mock response for development
        return {
            answer: `**Development Mode Response**\n\nThis is a placeholder response. Configure OPENAI_API_KEY in .env for real AI responses.\n\nMode: ${mode}\nQuestion: ${message}\n\n${mode === 'case' ? 'Selected documents: ' + documentContexts.length : 'Research sources available'}`,
            sources: mode === 'case'
                ? documentContexts.map(d => ({ type: 'document', title: d.title, id: d.id }))
                : [{ type: 'placeholder', title: 'Configure OpenAI' }],
            confidence: 'limited'
        };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let systemPrompt, userPrompt, sources = [];

    if (mode === 'case') {
        // STRICT RAG - Only use provided documents
        if (documentContexts.length === 0) {
            return {
                answer: 'Please select at least one document from the case to proceed.',
                sources: [],
                confidence: 'limited'
            };
        }

        const documentText = documentContexts.map(doc =>
            `Document: ${doc.title}\n${doc.extracted_text || doc.description || 'No text available'}`
        ).join('\n\n---\n\n');

        systemPrompt = `You are a legal assistant analyzing ONLY the provided case documents. 
CRITICAL RULES:
- You can ONLY use information from the provided documents
- If the answer is not in the documents, say "The selected documents do not contain sufficient information to answer this."
- Never use external legal knowledge
- Never make up citations or cases
- Always cite which document you used`;

        userPrompt = `Documents:\n${documentText}\n\nQuestion: ${message}\n\nProvide a detailed answer based ONLY on the documents above.`;

        sources = documentContexts.map(d => ({
            type: 'document',
            title: d.title,
            id: d.id
        }));
    } else {
        // EXPANDED RAG - Use legal knowledge + research sources
        systemPrompt = `You are an expert legal researcher specializing in Indian law.
Provide comprehensive legal analysis with proper citations.
Always cite Indian statutes, case law (SCC, AIR citations), and legal principles.
If you use a case, provide: Case Name, Court, Year, and relevance.
If uncertain, explicitly state your uncertainty level.`;

        userPrompt = message;

        if (researchSources.length > 0) {
            const sourcesText = researchSources.map(s =>
                `Source: ${s.title}\n${s.content || ''}`
            ).join('\n\n');
            userPrompt = `Research Sources:\n${sourcesText}\n\nQuestion: ${message}`;
            sources = researchSources.map(s => ({ type: 'research', title: s.title }));
        }
    }

    const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: mode === 'case' ? 0.3 : 0.7, // Lower temp for case mode (more factual)
        max_tokens: 2000
    });

    const answer = completion.choices[0].message.content;

    // Determine confidence based on response
    let confidence = 'moderate';
    if (answer.includes('do not contain') || answer.includes('insufficient information')) {
        confidence = 'limited';
    } else if (mode === 'case' && documentContexts.length >= 2) {
        confidence = 'high';
    }

    return { answer, sources, confidence };
}

export default router;
