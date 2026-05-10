import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess, requireRole } from '../middleware/auth.js';
import { transformFilter, parseSort } from '../utils/filterUtils.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(firmAccess);

// Invoices only for admins/independents
router.use(requireRole('independent_advocate', 'law_firm_admin'));

/**
 * GET /api/invoices
 */
router.get('/', async (req, res) => {
    try {
        const { case_id, status, sortBy = '-created_date', limit = 50 } = req.query;

        let where = { created_by: req.user.id };
        if (case_id) where.case_id = case_id;
        if (status) where.status = status;

        const orderBy = parseSort(sortBy);

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true, case_number: true } }
            }
        });

        res.json(invoices);
    } catch (error) {
        console.error('List invoices error:', error);
        res.status(500).json({ error: 'Failed to list invoices' });
    }
});

router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        // Transform MongoDB-style filter to Prisma format
        const prismaFilter = transformFilter(filter);
        let where = { ...prismaFilter, created_by: req.user.id };

        const orderBy = parseSort(sortBy);

        const invoices = await prisma.invoice.findMany({ where, orderBy, take: parseInt(limit) });
        res.json(invoices);
    } catch (error) {
        console.error('Filter invoices error:', error);
        res.status(500).json({ error: 'Failed to filter invoices' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { case: { select: { case_title: true, case_number: true, client_name: true } } }
        });
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get invoice' });
    }
});

router.post('/', async (req, res) => {
    try {
        const invoice = await prisma.invoice.create({
            data: { ...req.body, created_by: req.user.id, firm_id: req.firmId }
        });
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id, created_by, created_date, ...updateData } = req.body;
        const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: updateData });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await prisma.invoice.delete({ where: { id: req.params.id } });
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

export default router;
