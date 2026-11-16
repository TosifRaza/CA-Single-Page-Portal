import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB, closeDB } from '../config/db.js';
import { seedDatabase } from '../seeds/seed.js';

describe('CA ProFlow API Integration Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();

    // Login as demo CA Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tosif@rizassociates.com', password: 'Password123!' });

    authToken = loginRes.body.data.token;
  }, 30000);

  afterAll(async () => {
    await closeDB();
  });

  it('Health Check responds with status 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Rejects unauthorized requests without token', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats');
    expect(res.status).toBe(401);
  });

  it('Returns dashboard metrics matching screenshot KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpi.totalClients.value).toBe(248);
    expect(res.body.data.kpi.pendingWorks.value).toBe(86);
    expect(res.body.data.kpi.completedFilings.value).toBe(602);
    expect(res.body.data.compliance.rate).toBe(92);
  });

  it('Lists taxes and filters by group', async () => {
    const res = await request(app)
      .get('/api/v1/taxes?group=GST')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.taxes)).toBe(true);
  });

  it('Creates, retrieves, and updates a tax rule', async () => {
    const createRes = await request(app)
      .post('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxGroup: 'GST',
        taxName: 'GSTR-7 (TDS)',
        frequency: 'Monthly',
        dueDateRule: '10th Next Month',
        status: 'Active',
      });

    expect(createRes.status).toBe(201);
    const taxId = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/v1/taxes/${taxId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ dueDateRule: '12th Next Month' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.dueDateRule).toBe('12th Next Month');
  });

  it('Rejects duplicate client registration with same PAN', async () => {
    const res = await request(app)
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Duplicate Client',
        clientType: 'Business',
        businessType: 'Proprietorship',
        pan: 'AABCA1234F', // Existing PAN
        mobile: '9876543210',
      });

    expect(res.status).toBe(409);
  });

  it('Creates a work assignment and auto-generates workCode', async () => {
    const clientsRes = await request(app)
      .get('/api/v1/clients?limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    const worksRes = await request(app)
      .get('/api/v1/work-masters?limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    const employeesRes = await request(app)
      .get('/api/v1/employees?limit=1')
      .set('Authorization', `Bearer ${authToken}`);

    const assignRes = await request(app)
      .post('/api/v1/work-assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: clientsRes.body.data.clients[0]._id,
        workMasterId: worksRes.body.data.works[0]._id,
        employeeId: employeesRes.body.data.employees[0]._id,
        dueDate: '2026-12-15',
        remarks: 'Automated test assignment',
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.workCode).toMatch(/^WRK-\d{4}-\d{4}$/);
    expect(assignRes.body.data.status).toBe('Pending');
  });
});
