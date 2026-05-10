import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import casesRoutes from './routes/cases.js';
import documentsRoutes from './routes/documents.js';
import hearingsRoutes from './routes/hearings.js';
import tasksRoutes from './routes/tasks.js';
import invoicesRoutes from './routes/invoices.js';
import invitationsRoutes from './routes/invitations.js';
import assignmentsRoutes from './routes/assignments.js';
import libraryRoutes from './routes/library.js';
import researchRoutes from './routes/research.js';
import snippetsRoutes from './routes/snippets.js';
import usersRoutes from './routes/users.js';
import integrationsRoutes from './routes/integrations.js';
import researchChatRoutes from './routes/research-chat.js';
import researchNotesRoutes from './routes/research-notes.js';
import researchSourcesRoutes from './routes/research-sources.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make prisma available to routes
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/hearings', hearingsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/research-chat', researchChatRoutes);
app.use('/api/research-notes', researchNotesRoutes);
app.use('/api/research-sources', researchSourcesRoutes);
app.use('/api/snippets', snippetsRoutes);
app.use('/api/integrations', integrationsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing HTTP server...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Inkit Backend running at http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
});

export { prisma };
