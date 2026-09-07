import express from 'express';
import cors from 'cors';
import dataRoute from './routes/dataRoute';
import authRoutes from './routes/auth';
import strategiesRoutes from './routes/strategies';
import { restoreStrategyStates } from './restoreStates';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger';
import { HttpError } from './utils/HttpError';

const app = express();

app.use(cors());
app.use(express.json());

// ─── Mount routes ──────────────────────────────────────────
app.use('/v1', dataRoute);
app.use('/v1', authRoutes);
app.use('/v1', strategiesRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
    console.log(`Server running on http://localhost:${PORT}`);
    // ─── Restore EA states on startup ──────────────────────
    await restoreStrategyStates();
});
