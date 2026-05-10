import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/', async (req, res) => {
    try {
        const { document_id, case_id, sortBy = '-created_date', limit = 50 } = req.query;

        let where = { created_by: req.user.id };
        if (document_id) where.document_id = document_id;
        if (case_id) where.case_id = case_id;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const snippets = await prisma.snippet.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                document: { select: { title: true } },
                case: { select: { case_title: true } }
            }
        });

        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list snippets' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const snippets = await prisma.snippet.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit)
        });

        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter snippets' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const snippet = await prisma.snippet.findUnique({ where: { id: req.params.id } });
        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get snippet' });
    }
});

router.post('/', async (req, res) => {
    try {
        const snippet = await prisma.snippet.create({
            data: { ...req.body, created_by: req.user.id }
        });
        res.status(201).json(snippet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create snippet' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id, created_date, created_by, ...updateData } = req.body;
        const snippet = await prisma.snippet.update({ where: { id: req.params.id }, data: updateData });
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update snippet' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await prisma.snippet.delete({ where: { id: req.params.id } });
        res.json({ message: 'Snippet deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete snippet' });
    }
});

export default router;
