import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/invitations
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let where = {};

        // Law firm admins see invitations they sent
        if (req.user.account_type === 'law_firm_admin') {
            where.inviter_id = req.user.id;
        } else {
            // Others see invitations sent to their email
            where.invitee_email = req.user.email;
        }

        if (status) where.status = status;

        const invitations = await prisma.invitation.findMany({
            where,
            orderBy: { created_date: 'desc' },
            include: { inviter: { select: { full_name: true, firm_name: true } } }
        });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list invitations' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const invitations = await prisma.invitation.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit),
            include: { inviter: { select: { full_name: true, firm_name: true } } }
        });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to filter invitations' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const invitation = await prisma.invitation.findUnique({
            where: { id: req.params.id },
            include: { inviter: { select: { full_name: true, firm_name: true } } }
        });
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        res.json(invitation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get invitation' });
    }
});

router.post('/', requireRole('law_firm_admin'), async (req, res) => {
    try {
        const invitation = await prisma.invitation.create({
            data: { ...req.body, inviter_id: req.user.id }
        });
        res.status(201).json(invitation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});

/**
 * PUT /api/invitations/:id/accept
 * Accept an invitation
 */
router.put('/:id/accept', async (req, res) => {
    try {
        const invitation = await prisma.invitation.findUnique({ where: { id: req.params.id } });

        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
        if (invitation.invitee_email !== req.user.email) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Update invitation
        await prisma.invitation.update({
            where: { id: req.params.id },
            data: { status: 'accepted', accepted_at: new Date() }
        });

        // Update user to be part of the firm
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                account_type: invitation.role || 'associate',
                firm_admin_id: invitation.inviter_id
            }
        });

        res.json({ message: 'Invitation accepted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
});

router.put('/:id/decline', async (req, res) => {
    try {
        await prisma.invitation.update({
            where: { id: req.params.id },
            data: { status: 'declined' }
        });
        res.json({ message: 'Invitation declined' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to decline invitation' });
    }
});

router.delete('/:id', requireRole('law_firm_admin'), async (req, res) => {
    try {
        await prisma.invitation.delete({ where: { id: req.params.id } });
        res.json({ message: 'Invitation deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete invitation' });
    }
});

export default router;
