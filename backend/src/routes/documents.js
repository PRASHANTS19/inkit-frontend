import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticate, firmAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

router.use(authenticate);
router.use(firmAccess);

/**
 * GET /api/documents
 * List documents with optional filtering
 */
router.get('/', async (req, res) => {
    try {
        const { case_id, sortBy = '-created_date', limit = 50 } = req.query;

        let where = {};
        if (case_id) where.case_id = case_id;

        // Apply RLS based on user type
        if (req.user.account_type === 'client') {
            where.is_confidential = false;
        }

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const documents = await prisma.document.findMany({
            where,
            orderBy,
            take: parseInt(limit),
            include: {
                case: { select: { case_title: true, case_number: true } }
            }
        });

        res.json(documents);
    } catch (error) {
        console.error('List documents error:', error);
        res.status(500).json({ error: 'Failed to list documents' });
    }
});

/**
 * POST /api/documents/filter
 * Filter documents with complex conditions
 */
router.post('/filter', async (req, res) => {
    try {
        const { filter = {}, sortBy = '-created_date', limit = 50 } = req.body;

        const orderBy = sortBy.startsWith('-')
            ? { [sortBy.slice(1)]: 'desc' }
            : { [sortBy]: 'asc' };

        const documents = await prisma.document.findMany({
            where: filter,
            orderBy,
            take: parseInt(limit)
        });

        res.json(documents);
    } catch (error) {
        console.error('Filter documents error:', error);
        res.status(500).json({ error: 'Failed to filter documents' });
    }
});

/**
 * GET /api/documents/:id
 * Get a single document
 */
router.get('/:id', async (req, res) => {
    try {
        const document = await prisma.document.findUnique({
            where: { id: req.params.id },
            include: {
                case: { select: { case_title: true, case_number: true } },
                uploader: { select: { full_name: true, email: true } }
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Get document error:', error);
        res.status(500).json({ error: 'Failed to get document' });
    }
});

/**
 * POST /api/documents
 * Create a new document (without file upload - file_url should be provided)
 */
router.post('/', async (req, res) => {
    try {
        const document = await prisma.document.create({
            data: {
                ...req.body,
                uploaded_by: req.user.id,
                firm_id: req.firmId
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

/**
 * POST /api/documents/upload
 * Upload a file and create document record
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { case_id, title, document_type, description, is_confidential, tags } = req.body;

        const fileUrl = `/uploads/${req.file.filename}`;

        const document = await prisma.document.create({
            data: {
                title: title || req.file.originalname,
                case_id,
                document_type: document_type || 'evidence',
                file_url: fileUrl,
                file_size: req.file.size,
                file_type: path.extname(req.file.originalname).slice(1).toUpperCase(),
                uploaded_by: req.user.id,
                description,
                is_confidential: is_confidential === 'true',
                tags: tags ? JSON.parse(tags) : [],
                firm_id: req.firmId
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

/**
 * PUT /api/documents/:id
 * Update a document
 */
router.put('/:id', async (req, res) => {
    try {
        const { id, uploaded_by, created_date, file_url, ...updateData } = req.body;

        const document = await prisma.document.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(document);
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req, res) => {
    try {
        // Get document to delete file
        const document = await prisma.document.findUnique({
            where: { id: req.params.id }
        });

        if (document && document.file_url) {
            const filePath = path.join(process.env.UPLOAD_DIR || './uploads', path.basename(document.file_url));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.document.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

export default router;
