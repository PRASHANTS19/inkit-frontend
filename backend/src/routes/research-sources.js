import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for source uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads/research';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'source-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

router.use(authenticate);

/**
 * GET /api/research-sources
 * Get user's research sources
 */
router.get('/', async (req, res) => {
    try {
        const sources = await prisma.researchSource.findMany({
            where: {
                user_id: req.user.id
            },
            orderBy: { created_date: 'desc' }
        });

        res.json(sources.map(source => ({
            ...source,
            metadata: source.metadata ? JSON.parse(source.metadata) : null
        })));
    } catch (error) {
        console.error('Get research sources error:', error);
        res.status(500).json({ error: 'Failed to get sources' });
    }
});

/**
 * POST /api/research-sources
 * Add a new research source
 * Body: { title, source_type, content, file, metadata }
 */
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { title, source_type, content, metadata } = req.body;

        if (!title || !source_type) {
            return res.status(400).json({ error: 'Title and source type are required' });
        }

        const sourceData = {
            user_id: req.user.id,
            firm_id: req.user.firm_admin_id || null,
            title,
            source_type, // document, citation, statute, link
            content: content || null,
            file_url: req.file ? `/uploads/research/${req.file.filename}` : null,
            metadata: metadata ? JSON.stringify(metadata) : null
        };

        const source = await prisma.researchSource.create({
            data: sourceData
        });

        res.status(201).json({
            ...source,
            metadata: source.metadata ? JSON.parse(source.metadata) : null
        });
    } catch (error) {
        console.error('Create research source error:', error);
        res.status(500).json({ error: 'Failed to create source' });
    }
});

/**
 * DELETE /api/research-sources/:id
 * Delete a research source
 */
router.delete('/:id', async (req, res) => {
    try {
        const source = await prisma.researchSource.findUnique({
            where: { id: req.params.id }
        });

        if (!source || source.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Source not found' });
        }

        // Delete file if exists
        if (source.file_url) {
            const filePath = path.join(process.cwd(), source.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.researchSource.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Source deleted successfully' });
    } catch (error) {
        console.error('Delete research source error:', error);
        res.status(500).json({ error: 'Failed to delete source' });
    }
});

export default router;
