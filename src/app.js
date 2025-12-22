import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/api.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            config.frontendUrl,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Kariyerin Olsun Backend API Gateway - Active');
});

// Start Server
app.listen(config.port, () => {
    logger.system(`Gateway başlatıldı - Port ${config.port}`);
    logger.system(`CV Parser: ${config.cvParserUrl}`);
    logger.system(`Avatar Bot: ${config.avatarBotUrl}`);
});
