import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectDB } from '../config/db.js';
import { seedDatabase } from '../seeds/seed.js';
import { TaxGroup } from '../models/TaxGroup.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { Client } from '../models/Client.js';
import { Employee } from '../models/Employee.js';

describe('Strict Hierarchical Dependency Flow: Tax Group -> Tax Master -> Work Master', () => {
  let authToken: string;
  let organizationId: string;
  let testClientId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    await connectDB();
    await seedDatabase();
    // Login with existing seeded admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tosif@rizassociates.com', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.token;

    // Fetch existing client & employee for work assignment test
    const client = await Client.findOne();
    testClientId = client!._id.toString();
    organizationId = client!.organizationId.toString();

    const employee = await Employee.findOne();
    testEmployeeId = employee!._id.toString();
  });

  it('Step 1: When Tax Group Master has 0 groups, Tax Master blocks adding taxes and Work Master blocks adding works', async () => {
    // Completely clear TaxGroups, TaxMasters, WorkMasters
    await TaxGroup.deleteMany({ organizationId });
    await TaxMaster.deleteMany({ organizationId });
    await WorkMaster.deleteMany({ organizationId });
    await WorkAssignment.deleteMany({ organizationId });

    // 1. GET /taxes should return empty array
    const taxesGet = await request(app)
      .get('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`);
    expect(taxesGet.status).toBe(200);
    expect(taxesGet.body.data.taxes).toHaveLength(0);
    expect(taxesGet.body.data.pagination.total).toBe(0);

    // 2. POST /taxes must fail with 400 Bad Request
    const createTaxAttempt = await request(app)
      .post('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxName: 'GSTR-1',
        taxGroup: 'GST',
        frequency: 'Monthly',
        dueDateRule: '11th Next Month',
      });
    expect(createTaxAttempt.status).toBe(400);
    expect(createTaxAttempt.body.message).toContain('Tax Master strictly depends on Tax Group Master');

    // 3. POST /work-masters must fail with 400 Bad Request because 0 taxes exist
    const createWorkAttempt = await request(app)
      .post('/api/v1/work-masters')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        workName: 'GST Filing Job',
        category: 'GST',
        timeline: '2 Days',
        taxId: '6afc27c63e5405ddeafc5fd0',
      });
    expect(createWorkAttempt.status).toBe(400);
    expect(createWorkAttempt.body.message).toContain('Work Master strictly depends on Tax Master & Compliance');

    // 4. POST /work-assignments must fail with 400 Bad Request
    const assignAttempt = await request(app)
      .post('/api/v1/work-assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClientId,
        workMasterId: '6afc27c63e5405ddeafc5fd6',
        employeeId: testEmployeeId,
        dueDate: '2026-12-01',
      });
    expect(assignAttempt.status).toBe(400);
    expect(assignAttempt.body.message).toContain('active taxes in Tax Master & Compliance');
  });

  it('Step 2: When user creates a Tax Group, Tax Master allows adding Tax under that group', async () => {
    // 1. Create a Tax Group
    const groupRes = await request(app)
      .post('/api/v1/tax-groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        groupName: 'GST',
        groupCode: 'GST',
        description: 'Goods & Services Tax',
        defaultFrequency: 'Monthly',
      });
    expect(groupRes.status).toBe(201);
    const createdGroup = groupRes.body.data;

    // 2. Now creating a Tax under 'GST' succeeds
    const taxRes = await request(app)
      .post('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxName: 'GSTR-1 Outward Return',
        taxGroup: 'GST',
        frequency: 'Monthly',
        dueDateRule: '11th Next Month',
        priority: 'High',
      });
    expect(taxRes.status).toBe(201);
    expect(taxRes.body.data.taxName).toBe('GSTR-1 Outward Return');
    const createdTaxId = taxRes.body.data._id;

    // 3. Creating a Tax under a non-existent group fails
    const invalidGroupTaxRes = await request(app)
      .post('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        taxName: 'Custom Tax',
        taxGroup: 'NonExistentGroup',
        frequency: 'Monthly',
        dueDateRule: '15th',
      });
    expect(invalidGroupTaxRes.status).toBe(400);
    expect(invalidGroupTaxRes.body.message).toContain('does not exist in Tax Group Master');

    // Step 3: Now that Tax Master has an active tax, Work Master allows creating work templates linked to it
    const workRes = await request(app)
      .post('/api/v1/work-masters')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        workName: 'GSTR-1 Client Return Preparation',
        taxId: createdTaxId,
        category: 'GST',
        timeline: '3 Days',
        defaultPriority: 'High',
      });
    expect(workRes.status).toBe(201);
    const createdWorkId = workRes.body.data._id;

    // Step 4: Work Assignment now succeeds
    const assignRes = await request(app)
      .post('/api/v1/work-assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClientId,
        workMasterId: createdWorkId,
        employeeId: testEmployeeId,
        dueDate: '2026-12-05',
        priority: 'High',
      });
    expect(assignRes.status).toBe(201);

    // Step 5: Deleting the Tax Group cascades and cleanly deletes dependent Tax, Work Master, and Assignment
    const deleteGroupRes = await request(app)
      .delete(`/api/v1/tax-groups/${createdGroup._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(deleteGroupRes.status).toBe(200);

    // Verify taxes are empty
    const checkTaxes = await request(app)
      .get('/api/v1/taxes')
      .set('Authorization', `Bearer ${authToken}`);
    expect(checkTaxes.body.data.taxes).toHaveLength(0);

    // Verify work masters are empty
    const checkWorks = await request(app)
      .get('/api/v1/work-masters')
      .set('Authorization', `Bearer ${authToken}`);
    expect(checkWorks.body.data.works).toHaveLength(0);
  });
});
