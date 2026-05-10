import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate);

/**
 * POST /api/integrations/invoke-llm
 * Invoke LLM for AI responses (replaces Base44 InvokeLLM)
 */
router.post('/invoke-llm', async (req, res) => {
    try {
        const { prompt, add_context_from_internet, response_json_schema } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key') {
            // Return mock response for development
            return res.json({
                legal_analysis: "This is a development placeholder. Configure OPENAI_API_KEY in .env for real AI responses.",
                relevant_statutes: [
                    { act_name: "Sample Act", section: "Section 1", relevance: "Placeholder" }
                ],
                case_precedents: [
                    { case_name: "Sample Case", citation: "2024 SCC 1", relevance_score: 85, summary: "Placeholder case", key_principle: "Sample principle" }
                ],
                legal_arguments: [
                    { argument: "Sample argument", strength: "medium", supporting_law: "Sample law" }
                ],
                practical_advice: "Configure your OpenAI API key for real legal research capabilities.",
                confidence_score: 50
            });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const systemPrompt = `You are an expert legal researcher specializing in Indian law. 
    Provide comprehensive, accurate legal analysis with proper citations.
    Always cite relevant Indian statutes, case law (using proper citations like SCC, AIR), and legal principles.
    Be thorough but practical in your advice.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ];

        const completionParams = {
            model: 'gpt-4-turbo-preview',
            messages,
            temperature: 0.7,
            max_tokens: 4000
        };

        // Add JSON schema if provided
        if (response_json_schema) {
            completionParams.response_format = { type: 'json_object' };
            messages[1].content = `${prompt}\n\nRespond in JSON format following this schema: ${JSON.stringify(response_json_schema)}`;
        }

        const completion = await openai.chat.completions.create(completionParams);

        let result = completion.choices[0].message.content;

        // Parse JSON if schema was provided
        if (response_json_schema) {
            try {
                result = JSON.parse(result);
            } catch (e) {
                // Return as-is if not valid JSON
            }
        }

        res.json(result);
    } catch (error) {
        console.error('LLM invocation error:', error);
        res.status(500).json({ error: 'Failed to invoke LLM', details: error.message });
    }
});

/**
 * POST /api/integrations/upload-file
 * Upload a file (replaces Base44 UploadFile)
 */
router.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

        res.json({
            file_url: fileUrl,
            full_url: fullUrl,
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

/**
 * POST /api/integrations/send-email
 * Send email (stub for future implementation)
 */
router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, body, html } = req.body;

        // TODO: Implement with Nodemailer/Resend
        console.log('Email would be sent:', { to, subject });

        res.json({
            success: true,
            message: 'Email sending is not yet configured. Please set up SMTP settings.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send email' });
    }
});

/**
 * POST /api/integrations/send-sms
 * Send SMS (stub for future implementation)
 */
router.post('/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;

        // TODO: Implement with Twilio
        console.log('SMS would be sent:', { to, message });

        res.json({
            success: true,
            message: 'SMS sending is not yet configured. Please set up Twilio.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send SMS' });
    }
});

/**
 * POST /api/integrations/extract-data
 * Extract data from uploaded file (stub for future implementation)
 */
router.post('/extract-data', upload.single('file'), async (req, res) => {
    try {
        // TODO: Implement with PDF.js or similar
        res.json({
            success: true,
            message: 'Data extraction not yet implemented',
            text: ''
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to extract data' });
    }
});

export default router;
