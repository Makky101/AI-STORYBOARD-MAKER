import { rateLimit } from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    limit: 100, 
    standardHeaders: true, 
    legacyHeaders: false,
    validate: false,
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    }
});


export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    limit: 10, 
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    message: {
        status: 429,
        error: 'AI generation limit reached for this hour. Please try again later.'
    },
    keyGenerator: (req) => req.user?.id || req.ip
});
