import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/research-notes
 * Get research notes for user (optionally filtered by case_id)
 */
router.get('/', async (req, res) => {
    try {
        const { case_id } = req.query;

        const where = { user_id: req.user.id };
        if (case_id) {
            where.case_id = case_id;
        }

        const notes = await prisma.researchNote.findMany({
            where,
            orderBy: { created_date: 'desc' }
        });

        res.json(notes.map(note => ({
            ...note,
            sources: note.sources ? JSON.parse(note.sources) : []
        })));
    } catch (error) {
        console.error('Get research notes error:', error);
        res.status(500).json({ error: 'Failed to get notes' });
    }
});

/**
 * POST /api/research-notes
 * Create a new research note
 */
router.post('/', async (req, res) => {
    try {
        const { case_id, question, answer, sources, confidence } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ error: 'Question and answer are required' });
        }

        const note = await prisma.researchNote.create({
            data: {
                user_id: req.user.id,
                case_id: case_id || null,
                question,
                answer,
                sources: sources ? JSON.stringify(sources) : null,
                confidence: confidence || 'moderate'
            }
        });

        res.status(201).json({
            ...note,
            sources: note.sources ? JSON.parse(note.sources) : []
        });
    } catch (error) {
        console.error('Create research note error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

/**
 * DELETE /api/research-notes/:id
 * Delete a research note
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.researchNote.delete({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete research note error:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
