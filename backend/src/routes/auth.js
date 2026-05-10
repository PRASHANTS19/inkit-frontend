import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            account_type = 'independent_advocate',
            firm_name,
            bar_number,
            phone,
            specialization
        } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                full_name,
                account_type,
                firm_name,
                bar_number,
                phone,
                specialization: specialization || null
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                firm_name: true,
                bar_number: true,
                specialization: true,
                created_date: true
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            user,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client should clear token)
 */
router.post('/logout', (req, res) => {
    // JWT is stateless, so we just confirm logout
    // Client should remove the token from storage
    res.json({ message: 'Logged out successfully' });
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        const {
            full_name,
            firm_name,
            bar_number,
            phone,
            address,
            specialization
        } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(full_name !== undefined && { full_name }),
                ...(firm_name !== undefined && { firm_name }),
                ...(bar_number !== undefined && { bar_number }),
                ...(phone !== undefined && { phone }),
                ...(address !== undefined && { address }),
                ...(specialization !== undefined && { specialization })
            },
            select: {
                id: true,
                email: true,
                full_name: true,
                account_type: true,
                firm_name: true,
                firm_admin_id: true,
                bar_number: true,
                phone: true,
                address: true,
                specialization: true,
                is_active: true,
                created_date: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

export default router;
