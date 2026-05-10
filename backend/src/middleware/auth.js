import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch fresh user data
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
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

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (!user.is_active) {
                return res.status(403).json({ error: 'Account is deactivated' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if present
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId }
            });
            if (user && user.is_active) {
                req.user = user;
            }
        } catch (err) {
            // Token invalid, continue without user
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.account_type)) {
            return res.status(403).json({
                error: 'Access denied',
                message: `This action requires one of: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Firm access control - ensures user can only access data from their firm
 */
export const firmAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Determine the firm_id for this user
    if (req.user.account_type === 'law_firm_admin') {
        req.firmId = req.user.id;
    } else if (req.user.account_type === 'associate' || req.user.account_type === 'client') {
        req.firmId = req.user.firm_admin_id;
    } else {
        // Independent advocate - firm_id is their own id
        req.firmId = req.user.id;
    }

    next();
};
