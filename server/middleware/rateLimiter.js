import { rateLimit } from 'express-rate-limit';

// Standard API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true, // Use standard headers for rate limit info
    legacyHeaders: false,
    validate: false,
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    }
});

// Stricter limiter for AI generation (Script/Image)
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit to 10 AI generation requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        status: 429,
        error: 'AI generation limit reached for this hour. Please try again later.'
    },
    keyGenerator: (req) => req.user?.id || req.ip
});
