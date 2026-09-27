import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../auth';
import { adminAuth } from '../middleware/adminAuth';
import PDFDocument from 'pdfkit';
import { TERMS_VERSION, getTermsFullText, TERMS_SECTIONS } from '../terms/termsContent';

const router = Router();

// ─── GET /v1/terms/status — has current user accepted? ────
router.get('/terms/status', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const result = await query(
            `SELECT id, terms_version, accepted_at
             FROM user_terms_acceptance
             WHERE user_id = $1 AND terms_version = $2
             LIMIT 1`,
            [userId, TERMS_VERSION]
        );

        if (result.rows.length === 0) {
            return res.json({
                accepted: false,
                current_version: TERMS_VERSION,
            });
        }

        res.json({
            accepted: true,
            current_version: TERMS_VERSION,
            accepted_version: result.rows[0].terms_version,
            accepted_at: result.rows[0].accepted_at,
        });
    } catch (err: any) {
        console.error('Terms status error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /v1/terms/content — public, returns T&C for display ─
router.get('/terms/content', async (req, res) => {
    try {
        res.json({
            version: TERMS_VERSION,
            sections: TERMS_SECTIONS,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /v1/terms/accept — record acceptance ────────────
router.post('/terms/accept', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const email = req.user!.email;

        if (!req.body?.accepted) {
            return res.status(400).json({ error: 'You must check the acceptance box' });
        }

        const ipAddress =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
            req.socket?.remoteAddress ||
            null;
        const userAgent = req.headers['user-agent'] || null;

        const fullText = getTermsFullText();
        const contentHash = crypto.createHash('sha256').update(fullText).digest('hex');

        // Idempotent — if already accepted for this version, return existing
        const existing = await query(
            `SELECT id, accepted_at FROM user_terms_acceptance
             WHERE user_id = $1 AND terms_version = $2
             LIMIT 1`,
            [userId, TERMS_VERSION]
        );

        if (existing.rows.length > 0) {
            return res.json({
                success: true,
                already_accepted: true,
                accepted_at: existing.rows[0].accepted_at,
            });
        }

        const result = await query(
            `INSERT INTO user_terms_acceptance
             (user_id, email, terms_version, ip_address, user_agent, content_hash)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, accepted_at`,
            [userId, email, TERMS_VERSION, ipAddress, userAgent, contentHash]
        );

        console.log(`✅ Terms accepted: user ${userId} (${email}) — version ${TERMS_VERSION}`);

        res.status(201).json({
            success: true,
            accepted_at: result.rows[0].accepted_at,
            terms_version: TERMS_VERSION,
        });
    } catch (err: any) {
        console.error('Terms accept error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// ─── GET /v1/admin/terms-acceptances — list all ───────────
router.get('/admin/terms-acceptances', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const result = await query(
            `SELECT t.id, t.user_id, t.email, t.terms_version,
                    t.accepted_at, t.ip_address, t.user_agent, t.content_hash,
                    u.email AS user_account_email
             FROM user_terms_acceptance t
             LEFT JOIN users u ON u.id = t.user_id
             ORDER BY t.accepted_at DESC`
        );
        res.json({ acceptances: result.rows });
    } catch (err: any) {
        console.error('Admin terms list error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /v1/admin/terms-acceptances/:id/pdf ──────────────
// Generates the PDF on-the-fly from the stored record.
router.get('/admin/terms-acceptances/:id/pdf', authMiddleware, adminAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT t.*, u.email AS user_account_email
             FROM user_terms_acceptance t
             LEFT JOIN users u ON u.id = t.user_id
             WHERE t.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Acceptance record not found' });
        }

        const record = result.rows[0];

        // Verify integrity — content hash should match current T&C version
        const currentHash = crypto
            .createHash('sha256')
            .update(getTermsFullText())
            .digest('hex');
        const integrityOk = currentHash === record.content_hash;

        // ─── Build the PDF ─────────────────────────────────
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="terms-acceptance-${record.id}-${record.email.replace(/[^a-z0-9]/gi, '_')}.pdf"`
        );

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        // Header
        doc
            .fontSize(20)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text('CALEKYZ DIGITALISED SERVICE ENTERPRISES', { align: 'center' });

        doc
            .moveDown(0.3)
            .fontSize(11)
            .font('Helvetica')
            .fillColor('#475569')
            .text('Registered under the Registrar of Companies, Republic of Kenya', { align: 'center' });

        doc.moveDown(1);

        doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text('TERMS & CONDITIONS — ACCEPTANCE RECORD', { align: 'center' });

        doc.moveDown(1.5);

        // Acceptance details box
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text('ACCEPTANCE DETAILS', { underline: true });

        doc.moveDown(0.5);

        const rowY = (label: string, value: string) => {
            doc.font('Helvetica-Bold').fillColor('#334155').text(`${label}:`, { continued: true });
            doc.font('Helvetica').fillColor('#0f172a').text(`  ${value}`);
            doc.moveDown(0.2);
        };

        rowY('Record ID', String(record.id));
        rowY('User Email', record.email);
        rowY('Account Email', record.user_account_email || record.email);
        rowY('User ID', String(record.user_id));
        rowY('Terms Version', record.terms_version);
        rowY('Accepted At (UTC)', new Date(record.accepted_at).toISOString());
        rowY('IP Address', record.ip_address || 'not recorded');
        rowY('User Agent', (record.user_agent || 'not recorded').substring(0, 100));
        rowY('Content Hash (SHA-256)', record.content_hash || 'not recorded');
        rowY('Integrity', integrityOk ? '✓ Content unchanged' : '⚠ Content hash mismatch');

        doc.moveDown(1);
        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .strokeColor('#cbd5e1')
            .stroke();
        doc.moveDown(1);

        // Full terms text
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text('FULL TERMS & CONDITIONS', { underline: true });

        doc.moveDown(0.5);

        // Render each section
        for (const section of TERMS_SECTIONS) {
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#0f172a')
                .text(`${section.number}. ${section.title.toUpperCase()}`);
            doc.moveDown(0.2);

            doc
                .fontSize(9.5)
                .font('Helvetica')
                .fillColor('#334155')
                .text(section.body, { align: 'justify', lineGap: 1.5 });

            doc.moveDown(0.8);
        }

        doc.moveDown(1);

        // Signature footer
        doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .strokeColor('#cbd5e1')
            .stroke();

        doc.moveDown(1);

        doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text('ACCEPTANCE DECLARATION');

        doc.moveDown(0.5);

        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#334155')
            .text(
                `The user identified above by email ${record.email} has electronically accepted ` +
                `Version ${record.terms_version} of the Terms and Conditions of CALEKYZ DIGITALISED ` +
                `SERVICE ENTERPRISES on ${new Date(record.accepted_at).toUTCString()}. ` +
                `This record was generated automatically and serves as proof of acceptance in the ` +
                `event of any dispute.`,
                { align: 'justify' }
            );

        doc.moveDown(2);

        doc
            .fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor('#64748b')
            .text(
                `Document generated on ${new Date().toUTCString()} · PipTrader AI Platform`,
                { align: 'center' }
            );

        doc.end();
    } catch (err: any) {
        console.error('PDF generation error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

export default router;
