import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ============================================================================
// CASE ASSIGNMENTS
// ============================================================================

router.get('/cases', async (req, res) => {
    try {
        const { case_id, user_id } = req.query;
        let where = {};
        if (case_id) where.case_id = case_id;
        if (user_id) where.assigned_to_user_id = user_id;

        const assignments = await prisma.caseAssignment.findMany({
            where,
            include: {
                case: { select: { case_title: true, case_number: true } },
                assignee: { select: { full_name: true, email: true } },
                assigner: { select: { full_name: true } }
            }
        });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list case assignments' });
    }
});

router.post('/cases', requireRole('law_firm_admin'), async (req, res) => {
    try {
        const assignment = await prisma.caseAssignment.create({
            data: { ...req.body, assigned_by_user_id: req.user.id }
        });
        res.status(201).json(assignment);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User already assigned to this case' });
        }
        res.status(500).json({ error: 'Failed to create case assignment' });
    }
});

router.delete('/cases/:id', requireRole('law_firm_admin'), async (req, res) => {
    try {
        await prisma.caseAssignment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Assignment removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
});

// Filter for Base44 compatibility
router.post('/cases/filter', async (req, res) => {
    try {
        const { filter = {} } = req.body;
        const assignments = await prisma.caseAssignment.findMany({
            where: filter,
            include: {
                case: { select: { case_title: true } },
                assignee: { select: { full_name: true } }
            }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter assignments' });
    }
});

// ============================================================================
// TASK ASSIGNMENTS
// ============================================================================

router.get('/tasks', async (req, res) => {
    try {
        const { task_id, user_id } = req.query;
        let where = {};
        if (task_id) where.task_id = task_id;
        if (user_id) where.user_id = user_id;

        const assignments = await prisma.taskAssignment.findMany({
            where,
            include: {
                task: { select: { title: true } },
                user: { select: { full_name: true, email: true } }
            }
        });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list task assignments' });
    }
});

router.post('/tasks', requireRole('law_firm_admin', 'independent_advocate'), async (req, res) => {
    try {
        const assignment = await prisma.taskAssignment.create({ data: req.body });
        res.status(201).json(assignment);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User already assigned to this task' });
        }
        res.status(500).json({ error: 'Failed to create task assignment' });
    }
});

router.delete('/tasks/:id', requireRole('law_firm_admin', 'independent_advocate'), async (req, res) => {
    try {
        await prisma.taskAssignment.delete({ where: { id: req.params.id } });
        res.json({ message: 'Task assignment removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task assignment' });
    }
});

router.post('/tasks/filter', async (req, res) => {
    try {
        const { filter = {} } = req.body;
        const assignments = await prisma.taskAssignment.findMany({ where: filter });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter task assignments' });
    }
});

export default router;
