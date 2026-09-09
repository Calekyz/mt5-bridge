import express from 'express';
import cors from 'cors';
import dataRoute from './routes/dataRoute';
import authRoutes from './routes/auth';
import strategiesRoutes from './routes/strategies';
import adminRoutes from './routes/admin';
import accountRoutes from './routes/account'; // ✅ this file must exist
import orderRoutes from './routes/order/orderRoutes';
import historyRoutes from './routes/history/historyRoutes';
import { restoreStrategyStates } from './restoreStates';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { HttpError } from './utils/HttpError';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/v1', dataRoute);
app.use('/v1', authRoutes);
app.use('/v1', strategiesRoutes);
app.use('/v1', adminRoutes);
app.use('/v1', accountRoutes);
app.use('/v1', orderRoutes);
app.use('/v1', historyRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 404
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: { message: err.message, statusCode: err.statusCode } });
    } else {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: { message: 'Internal Server Error', statusCode: 500 } });
    }
});

const PORT = process.env.PORT || 8891;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await restoreStrategyStates();
});
