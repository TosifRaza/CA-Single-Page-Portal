import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import { seedDatabase } from '../seeds/seed.js';

describe('Advanced Tax Rule & Filing Compliance Tests', () => {
  let authToken: string;
  let sampleClientId: string;
  let sampleTaxRuleId: string;
  let createdFilingId: string;

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'tosif@rizassociates.com',
      password: 'Password123!',
    });

    authToken = loginRes.body.data.token;

    // Get sample client and tax rule
    const clientsRes = await request(app)
      .get('/api/v1/clients?limit=1')
      .set('Authorization', `Bearer ${authToken}`);
    sampleClientId = clientsRes.body.data.clients[0]._id;

    const taxesRes = await request(app)
      .get('/api/v1/taxes?limit=1')
      .set('Authorization', `Bearer ${authToken}`);
    sampleTaxRuleId = taxesRes.body.data.taxes[0]._id;
  });

  it('Rejects Tax Filing creation if From Date is after To Date', async () => {
    const res = await request(app)
      .post('/api/v1/tax-filings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxRuleId: sampleTaxRuleId,
        clientId: sampleClientId,
        periodFrom: '2026-12-01',
        periodTo: '2026-11-01', // Invalid: From > To
        originalDueDate: '2026-12-20',
        filingStatus: 'Pending',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('From Date cannot be after To Date');
  });

  it('Creates Tax Filing and auto-calculates effectiveDueDate & differenceAmount', async () => {
    const res = await request(app)
      .post('/api/v1/tax-filings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxRuleId: sampleTaxRuleId,
        clientId: sampleClientId,
        periodFrom: '2026-11-01',
        periodTo: '2026-11-30',
        filingPeriod: 'Nov 2026',
        originalDueDate: '2026-12-11',
        reconciliationRequired: true,
        reconciliationType: 'GSTR-2B vs Purchase Register',
        reconciliationStatus: 'Mismatch',
        amountAsPerBooks: 150000,
        amountAsPerStatement: 140000,
        priority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    createdFilingId = res.body.data._id;

    // Effective due date should equal original due date since no extension was provided
    expect(new Date(res.body.data.effectiveDueDate).toISOString().split('T')[0]).toBe('2026-12-11');
    // Difference amount should be 150000 - 140000 = 10000
    expect(res.body.data.differenceAmount).toBe(10000);
  });

  it('Extends filing deadline, preserves original due date, and records audit history', async () => {
    const res = await request(app)
      .post(`/api/v1/tax-filings/${createdFilingId}/extend-deadline`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        extendedDueDate: '2026-12-25',
        extensionReason: 'GST portal annual update downtime per Notification 99/2026',
        extensionReference: 'CBIC-99/2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.extendedDueDate).toBeDefined();
    expect(new Date(res.body.data.effectiveDueDate).toISOString().split('T')[0]).toBe('2026-12-25');
    // Original due date is preserved!
    expect(new Date(res.body.data.originalDueDate).toISOString().split('T')[0]).toBe('2026-12-11');
    // Extension history contains audit record
    expect(res.body.data.extensionHistory.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.extensionHistory[0].reason).toContain('GST portal annual update downtime');
  });

  it('Updates reconciliation status and resolves mismatch', async () => {
    const res = await request(app)
      .patch(`/api/v1/tax-filings/${createdFilingId}/reconciliation`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reconciliationStatus: 'Reconciled',
        amountAsPerBooks: 150000,
        amountAsPerStatement: 150000, // Matched
        reconciledBy: 'Tosif Raza',
        reconciliationRemarks: 'Missing invoice received from supplier and uploaded',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reconciliationStatus).toBe('Reconciled');
    expect(res.body.data.differenceAmount).toBe(0);
  });

  it('Updates filing status to Filed with acknowledgement number', async () => {
    const res = await request(app)
      .patch(`/api/v1/tax-filings/${createdFilingId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        filingStatus: 'Filed',
        acknowledgementNumber: 'ARN-TEST-26998800',
        submissionMethod: 'Portal',
        filingRemarks: 'Filed successfully with DSC',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.filingStatus).toBe('Filed');
    expect(res.body.data.acknowledgementNumber).toBe('ARN-TEST-26998800');
    expect(res.body.data.actualSubmissionDate).toBeDefined();
  });

  it('Dashboard stats reflect tax compliance counts from MongoDB', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.taxCompliance).toBeDefined();
    expect(typeof res.body.data.taxCompliance.pendingFilings).toBe('number');
    expect(typeof res.body.data.taxCompliance.completedFilings).toBe('number');
    expect(typeof res.body.data.taxCompliance.extendedDeadlines).toBe('number');
  });
});
