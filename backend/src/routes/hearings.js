import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(firmAccess);

/**
 * GET /api/hearings
 * List hearings with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        const { case_id, status, sortBy = 'hearing_date', limit = 50, upcoming } = req.query;

        let where = {};
        if (case_id) where.case_id = case_id;
        if (status) where.status = status;
        if (upcoming === 'true') {
            where.hearing_date = { gte: new Date() };
            where.status = 'scheduled';
        }

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const hearings = await prisma.hearing.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true, case_number: true, client_name: true } }
            }
        });

        res.json(hearings);
    } catch (error) {
        console.error('List hearings error:', error);
        res.status(500).json({ error: 'Failed to list hearings' });
    }
});

/**
 * POST /api/hearings/filter
 */
router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = 'hearing_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const hearings = await prisma.hearing.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true, case_number: true } }
            }
        });

        res.json(hearings);
    } catch (error) {
        console.error('Filter hearings error:', error);
        res.status(500).json({ error: 'Failed to filter hearings' });
    }
});

/**
 * GET /api/hearings/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const hearing = await prisma.hearing.findUnique({
            where: { id: req.params.id },
            include: {
                case: { select: { case_title: true, case_number: true, client_name: true } }
            }
        });

        if (!hearing) {
            return res.status(404).json({ error: 'Hearing not found' });
        }

        res.json(hearing);
    } catch (error) {
        console.error('Get hearing error:', error);
        res.status(500).json({ error: 'Failed to get hearing' });
    }
});

/**
 * POST /api/hearings
 */
router.post('/', async (req, res) => {
    try {
        const hearing = await prisma.hearing.create({
            data: {
                ...req.body,
                firm_id: req.firmId
            }
        });

        res.status(201).json(hearing);
    } catch (error) {
        console.error('Create hearing error:', error);
        res.status(500).json({ error: 'Failed to create hearing' });
    }
});

/**
 * PUT /api/hearings/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id, created_date, ...updateData } = req.body;

        const hearing = await prisma.hearing.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(hearing);
    } catch (error) {
        console.error('Update hearing error:', error);
        res.status(500).json({ error: 'Failed to update hearing' });
    }
});

/**
 * DELETE /api/hearings/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.hearing.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Hearing deleted successfully' });
    } catch (error) {
        console.error('Delete hearing error:', error);
        res.status(500).json({ error: 'Failed to delete hearing' });
    }
});

export default router;
