import express from 'express';
import cors from 'cors';
import dataRoute from './routes/dataRoute';
import authRoutes from './routes/auth';
import strategiesRoutes from './routes/strategies';
import adminRoutes from './routes/admin'; // <-- must exist and export default router
import accountRoutes from './routes/account';
import orderRoutes from './routes/order/orderRoutes';
import historyRoutes from './routes/history/historyRoutes';
import { restoreStrategyStates } from './restoreStates';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { HttpError } from './utils/HttpError';

const app = express();

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check (for Render / frontend monitoring) ────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/v1', dataRoute);
app.use('/v1', authRoutes);
app.use('/v1', strategiesRoutes);
app.use('/v1', adminRoutes);
app.use('/v1', accountRoutes);
app.use('/v1', orderRoutes);
app.use('/v1', historyRoutes);

// ─── Swagger Docs ─────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: { message: err.message, statusCode: err.statusCode } });
    } else {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: { message: 'Internal Server Error', statusCode: 500 } });
    }
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 8891;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs available at http://localhost:${PORT}/api-docs`);
    await restoreStrategyStates();
    console.log('✅ Strategy states restored');
});
