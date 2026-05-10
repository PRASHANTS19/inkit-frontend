import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/users
 * List users (for admins to see associates, etc.)
 */
router.get('/', requireRole('law_firm_admin', 'independent_advocate'), async (req, res) => {
    try {
        const { account_type, firm_admin_id } = req.query;

        let where = {};
        if (account_type) where.account_type = account_type;
        if (firm_admin_id) where.firm_admin_id = firm_admin_id;

        // Admins can only see their own associates
        if (req.user.account_type === 'law_firm_admin') {
            where.firm_admin_id = req.user.id;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                firm_name: true,
                bar_number: true,
                phone: true,
                specialization: true,
                is_active: true,
                created_date: true
            }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list users' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const users = await prisma.user.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit),
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                firm_name: true,
                is_active: true,
                created_date: true
            }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter users' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                firm_name: true,
                bar_number: true,
                phone: true,
                address: true,
                specialization: true,
                is_active: true,
                created_date: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * PUT /api/users/:id
 * Update user (admin can update associates)
 */
router.put('/:id', requireRole('law_firm_admin'), async (req, res) => {
    try {
        const { id, password, email, created_date, ...updateData } = req.body;

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                is_active: true
            }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
