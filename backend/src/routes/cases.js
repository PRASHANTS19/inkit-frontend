import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication and firm context
router.use(authenticate);
router.use(firmAccess);

/**
 * GET /api/cases
 * List all cases with optional filtering and sorting
 */
router.get('/', async (req, res) => {
    try {
        const {
            sortBy = '-created_date',
            limit = 50,
            status,
            case_type,
            priority,
            client_name,
            search
        } = req.query;

        // Build where clause based on user type
        let where = {};

        if (req.user.account_type === 'associate') {
            // Associates can only see cases assigned to them
            const assignments = await prisma.caseAssignment.findMany({
                where: { assigned_to_user_id: req.user.id },
                select: { case_id: true }
            });
            where.id = { in: assignments.map(a => a.case_id) };
        } else if (req.user.account_type === 'client') {
            where.client_id = req.user.id;
        } else {
            // Admin/Independent - filter by firm
            where.OR = [
                { created_by: req.user.id },
                { firm_id: req.firmId }
            ];
        }

        // Apply filters
        if (status) where.status = status;
        if (case_type) where.case_type = case_type;
        if (priority) where.priority = priority;
        if (client_name) where.client_name = { contains: client_name, mode: 'insensitive' };
        if (search) {
            where.OR = [
                { case_title: { contains: search, mode: 'insensitive' } },
                { case_number: { contains: search, mode: 'insensitive' } },
                { client_name: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Parse sort
        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const cases = await prisma.case.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                _count: {
                    select: { documents: true, hearings: true, tasks: true }
                }
            }
        });

        res.json(cases);
    } catch (error) {
        console.error('List cases error:', error);
        res.status(500).json({ error: 'Failed to list cases' });
    }
});

/**
 * POST /api/cases/filter
 * Filter cases with complex conditions (Base44 SDK compatibility)
 */
router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        // Build where clause
        let where = { ...filter };

        // Apply firm/role restrictions
        if (req.user.account_type === 'associate') {
            const assignments = await prisma.caseAssignment.findMany({
                where: { assigned_to_user_id: req.user.id },
                select: { case_id: true }
            });
            where.id = { in: assignments.map(a => a.case_id) };
        } else if (req.user.account_type !== 'client') {
            where.OR = [
                { created_by: req.user.id },
                { firm_id: req.firmId }
            ];
        }

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const cases = await prisma.case.findMany({
            where,
            orderBy,
            take: parseInt(limit)
        });

        res.json(cases);
    } catch (error) {
        console.error('Filter cases error:', error);
        res.status(500).json({ error: 'Failed to filter cases' });
    }
});

/**
 * GET /api/cases/:id
 * Get a single case by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const caseData = await prisma.case.findUnique({
            where: { id: req.params.id },
            include: {
                documents: { orderBy: { created_date: 'desc' }, take: 10 },
                hearings: { orderBy: { hearing_date: 'asc' }, take: 10 },
                tasks: { orderBy: { due_date: 'asc' }, take: 10 },
                assignments: { include: { assignee: { select: { id: true, full_name: true, email: true } } } }
            }
        });

        if (!caseData) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json(caseData);
    } catch (error) {
        console.error('Get case error:', error);
        res.status(500).json({ error: 'Failed to get case' });
    }
});

/**
 * POST /api/cases
 * Create a new case
 */
router.post('/', async (req, res) => {
    try {
        const caseData = await prisma.case.create({
            data: {
                ...req.body,
                created_by: req.user.id,
                firm_id: req.firmId
            }
        });

        res.status(201).json(caseData);
    } catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ error: 'Failed to create case' });
    }
});

/**
 * PUT /api/cases/:id
 * Update a case
 */
router.put('/:id', async (req, res) => {
    try {
        const { id, created_by, created_date, ...updateData } = req.body;

        const caseData = await prisma.case.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(caseData);
    } catch (error) {
        console.error('Update case error:', error);
        res.status(500).json({ error: 'Failed to update case' });
    }
});

/**
 * DELETE /api/cases/:id
 * Delete a case
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.case.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Case deleted successfully' });
    } catch (error) {
        console.error('Delete case error:', error);
        res.status(500).json({ error: 'Failed to delete case' });
    }
});

export default router;
