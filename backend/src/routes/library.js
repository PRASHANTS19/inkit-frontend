import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(firmAccess);

router.get('/', async (req, res) => {
    try {
        const { category, is_template, sortBy = '-created_date', limit = 50 } = req.query;

        let where = {};
        if (category) where.category = category;
        if (is_template !== undefined) where.is_template = is_template === 'true';

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const documents = await prisma.libraryDocument.findMany({
            where,
            orderBy,
            take: parseInt(limit)
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list library documents' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const documents = await prisma.libraryDocument.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit)
        });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter library documents' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const doc = await prisma.libraryDocument.findUnique({ where: { id: req.params.id } });
        if (!doc) return res.status(404).json({ error: 'Library document not found' });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get library document' });
    }
});

router.post('/', async (req, res) => {
    try {
        const doc = await prisma.libraryDocument.create({
            data: { ...req.body, created_by: req.user.id, firm_id: req.firmId }
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create library document' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id, created_date, ...updateData } = req.body;
        const doc = await prisma.libraryDocument.update({ where: { id: req.params.id }, data: updateData });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update library document' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await prisma.libraryDocument.delete({ where: { id: req.params.id } });
        res.json({ message: 'Library document deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete library document' });
    }
});

export default router;
