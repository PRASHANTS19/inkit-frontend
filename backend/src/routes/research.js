import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(firmAccess);

router.get('/', async (req, res) => {
    try {
        const { case_id, bookmark, sortBy = '-created_date', limit = 50 } = req.query;

        let where = { created_by: req.user.id };
        if (case_id) where.case_id = case_id;
        if (bookmark !== undefined) where.bookmark = bookmark === 'true';

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const queries = await prisma.researchQuery.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: { case: { select: { case_title: true } } }
        });

        res.json(queries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list research queries' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const queries = await prisma.researchQuery.findMany({
            where: { ...filter, created_by: req.user.id },
            orderBy,
            take: parseInt(limit)
        });

        res.json(queries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter research queries' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const query = await prisma.researchQuery.findUnique({
            where: { id: req.params.id },
            include: { case: { select: { case_title: true } } }
        });
        if (!query) return res.status(404).json({ error: 'Research query not found' });
        res.json(query);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get research query' });
    }
});

router.post('/', async (req, res) => {
    try {
        const query = await prisma.researchQuery.create({
            data: { ...req.body, created_by: req.user.id }
        });
        res.status(201).json(query);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create research query' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id, created_date, created_by, ...updateData } = req.body;
        const query = await prisma.researchQuery.update({ where: { id: req.params.id }, data: updateData });
        res.json(query);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update research query' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await prisma.researchQuery.delete({ where: { id: req.params.id } });
        res.json({ message: 'Research query deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete research query' });
    }
});

export default router;
