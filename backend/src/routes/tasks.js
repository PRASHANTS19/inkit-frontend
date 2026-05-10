import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';
import { transformFilter, parseSort } from '../utils/filterUtils.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(firmAccess);

/**
 * GET /api/tasks
 */
router.get('/', async (req, res) => {
    try {
        const { case_id, status, assigned_to, sortBy = '-created_date', limit = 50 } = req.query;

        let where = {};
        if (case_id) where.case_id = case_id;
        if (status) where.status = status;
        if (assigned_to) where.assigned_to = assigned_to;

        // Associates only see their tasks
        if (req.user.account_type === 'associate') {
            where.assigned_to = req.user.id;
        }

        const orderBy = parseSort(sortBy);

        const tasks = await prisma.task.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true, case_number: true } },
                assignee: { select: { full_name: true, email: true } }
            }
        });

        res.json(tasks);
    } catch (error) {
        console.error('List tasks error:', error);
        res.status(500).json({ error: 'Failed to list tasks' });
    }
});

/**
 * POST /api/tasks/filter
 */
router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        // Transform MongoDB-style filter to Prisma format
        const prismaFilter = transformFilter(filter);
        let where = { ...prismaFilter };

        // Associates only see their tasks
        if (req.user.account_type === 'associate') {
            where.assigned_to = req.user.id;
        }

        const orderBy = parseSort(sortBy);

        const tasks = await prisma.task.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true } },
                assignee: { select: { full_name: true } }
            }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Filter tasks error:', error);
        res.status(500).json({ error: 'Failed to filter tasks' });
    }
});

/**
 * GET /api/tasks/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                case: { select: { case_title: true, case_number: true } },
                assignee: { select: { full_name: true, email: true } }
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Failed to get task' });
    }
});

/**
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
    try {
        const task = await prisma.task.create({
            data: {
                ...req.body,
                firm_id: req.firmId
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

/**
 * PUT /api/tasks/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id, created_date, ...updateData } = req.body;

        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

/**
 * DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        await prisma.task.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
