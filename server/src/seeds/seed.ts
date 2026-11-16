import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { Employee } from '../models/Employee.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { TaxFiling } from '../models/TaxFiling.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { FinancialYear, Branch, Service } from '../models/Masters.js';
import { DocumentCategory } from '../models/Document.js';
import { Payment, Notification, ActivityLog } from '../models/Operations.js';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('[Seeder] Connected to database. Clearing existing records...');

    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Client.deleteMany({}),
      Employee.deleteMany({}),
      TaxMaster.deleteMany({}),
      TaxFiling.deleteMany({}),
      WorkMaster.deleteMany({}),
      WorkAssignment.deleteMany({}),
      FinancialYear.deleteMany({}),
      Branch.deleteMany({}),
      Service.deleteMany({}),
      DocumentCategory.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    console.log('[Seeder] Creating Organization: RIZ & Associates...');
    const org = await Organization.create({
      name: 'RIZ & Associates',
      email: 'contact@rizassociates.com',
      phone: '+91 98765 43210',
      address: {
        line1: 'Suite 401, Commerce Tower',
        line2: 'Park Street Business District',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        country: 'India',
      },
      settings: {
        defaultFinancialYear: '2026-27',
        defaultTheme: 'light',
        timeZone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        reminderDaysBefore: 3,
      },
    });

    console.log('[Seeder] Creating Financial Years...');
    const [fy2026, fy2025] = await Promise.all([
      FinancialYear.create({
        organizationId: org._id,
        yearName: '2026-27',
        assessmentYear: '2027-28',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isCurrent: true,
        status: 'active',
      }),
      FinancialYear.create({
        organizationId: org._id,
        yearName: '2025-26',
        assessmentYear: '2026-27',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isCurrent: false,
        status: 'active',
      }),
    ]);

    console.log('[Seeder] Creating Branches...');
    const [branchHQ, branchMum, branchDel] = await Promise.all([
      Branch.create({
        organizationId: org._id,
        branchName: 'Head Office - Kolkata',
        branchCode: 'KOL-HQ',
        city: 'Kolkata',
        state: 'West Bengal',
        phone: '+91 33 2289 1000',
        email: 'kolkata@rizassociates.com',
        status: 'active',
      }),
      Branch.create({
        organizationId: org._id,
        branchName: 'Mumbai West Branch',
        branchCode: 'MUM-01',
        city: 'Mumbai',
        state: 'Maharashtra',
        phone: '+91 22 2876 5432',
        email: 'mumbai@rizassociates.com',
        status: 'active',
      }),
      Branch.create({
        organizationId: org._id,
        branchName: 'Delhi NCR Branch',
        branchCode: 'DEL-01',
        city: 'New Delhi',
        state: 'Delhi',
        phone: '+91 11 2345 6789',
        email: 'delhi@rizassociates.com',
        status: 'active',
      }),
    ]);

    console.log('[Seeder] Creating Employees & Users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // Primary CA Admin: Tosif Raza
    const empAdmin = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0001',
      name: 'Tosif Raza',
      email: 'tosif@rizassociates.com',
      mobile: '9876543210',
      designation: 'CA Admin',
      department: 'Direct & Indirect Tax',
      branchId: branchHQ._id,
      joiningDate: new Date('2020-01-15'),
      status: 'active',
    });

    const userAdmin = await User.create({
      organizationId: org._id,
      name: 'Tosif Raza',
      email: 'tosif@rizassociates.com',
      passwordHash,
      role: 'CA Admin',
      employeeId: empAdmin._id,
      status: 'active',
    });
    empAdmin.userId = userAdmin._id as any;
    await empAdmin.save();

    // Additional Employees
    const empAnita = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0002',
      name: 'Anita Desai',
      email: 'anita@rizassociates.com',
      mobile: '9876543211',
      designation: 'GST Manager',
      department: 'Indirect Tax',
      branchId: branchHQ._id,
      status: 'active',
    });

    const empVikram = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0003',
      name: 'Vikram Roy',
      email: 'vikram@rizassociates.com',
      mobile: '9876543212',
      designation: 'Tax Senior',
      department: 'Direct Tax',
      branchId: branchMum._id,
      status: 'active',
    });

    const empPriya = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0004',
      name: 'Priya Nair',
      email: 'priya@rizassociates.com',
      mobile: '9876543213',
      designation: 'Compliance Officer',
      department: 'Corporate & Regulatory',
      branchId: branchDel._id,
      status: 'active',
    });

    const empArjun = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0005',
      name: 'Arjun Maitra',
      email: 'arjun@rizassociates.com',
      mobile: '9876543214',
      designation: 'Senior Accountant',
      department: 'Audit & Accounts',
      branchId: branchHQ._id,
      status: 'active',
    });

    const empNandita = await Employee.create({
      organizationId: org._id,
      employeeCode: 'EMP-0006',
      name: 'Nandita Bose',
      email: 'nandita@rizassociates.com',
      mobile: '9876543215',
      designation: 'Knowledge Manager',
      department: 'Legal Research',
      branchId: branchHQ._id,
      status: 'active',
    });

    console.log('[Seeder] Creating Tax Masters (only 2 data items)...');
    const taxData = [
      {
        id: 1,
        group: 'GST',
        name: 'GSTR-1',
        freq: 'Monthly',
        due: '11th Next Month',
        status: 'Active',
        desc: 'Monthly return for outward supplies of goods and services',
        from: '2026-10-01',
        to: '2026-10-31',
        subDate: '2026-11-10',
        prio: 'High',
        recon: true,
      },
      {
        id: 2,
        group: 'GST',
        name: 'GSTR-3B',
        freq: 'Monthly',
        due: '20th Next Month',
        status: 'Active',
        desc: 'Monthly summary return for payment of tax liability & ITC claim',
        from: '2026-10-01',
        to: '2026-10-31',
        subDate: '2026-11-19',
        prio: 'Critical',
        recon: true,
      },
    ];

    const taxes = await Promise.all(
      taxData.map((t) =>
        TaxMaster.create({
          organizationId: org._id,
          taxId: t.id,
          taxGroup: t.group as any,
          taxName: t.name,
          description: t.desc,
          frequency: t.freq as any,
          dueDateRule: t.due,
          periodFrom: t.from ? new Date(t.from) : undefined,
          periodTo: t.to ? new Date(t.to) : undefined,
          submissionDate: t.subDate ? new Date(t.subDate) : undefined,
          actualSubmissionDate: t.subDate ? new Date(t.subDate) : undefined,
          priority: t.prio as any,
          reconciliationRequired: t.recon,
          status: t.status as any,
          applicableFinancialYear: '2026-27',
        })
      )
    );

    console.log('[Seeder] Creating Work Masters matching screenshot (4 works)...');
    const workData = [
      { id: 1, name: 'GSTR-1 Filing', cat: 'GST', timeline: '2 Days', taxIndex: 0, prio: 'High' },
      { id: 2, name: 'GSTR-3B Filing', cat: 'GST', timeline: '3 Days', taxIndex: 1, prio: 'Medium' },
      { id: 3, name: 'GST Audit & Recon', cat: 'GST', timeline: '5 Days', taxIndex: 0, prio: 'Medium' },
      { id: 4, name: 'GST Registration', cat: 'GST', timeline: '7 Days', taxIndex: 1, prio: 'Urgent' },
    ];

    const workMasters = await Promise.all(
      workData.map((w) =>
        WorkMaster.create({
          organizationId: org._id,
          workId: w.id,
          workName: w.name,
          category: w.cat as any,
          timeline: w.timeline,
          taxId: taxes[w.taxIndex]._id,
          defaultPriority: w.prio as any,
          defaultChecklist: [
            'Collect invoices & vouchers from client',
            'Reconcile with 2B / 26AS data',
            'Draft computation and review tax liability',
            'Obtain client sign-off and approval',
            'Portal submission and ARN generation',
          ],
          status: 'Active',
        })
      )
    );

    console.log('[Seeder] Creating Services & Document Categories...');
    await Promise.all([
      Service.create({ organizationId: org._id, serviceName: 'Monthly GST Compliance', category: 'GST', defaultPrice: 4999 }),
      Service.create({ organizationId: org._id, serviceName: 'Income Tax Return (Corporate)', category: 'Income Tax', defaultPrice: 15000 }),
      Service.create({ organizationId: org._id, serviceName: 'TDS Quarterly Filing', category: 'TDS', defaultPrice: 3500 }),
      Service.create({ organizationId: org._id, serviceName: 'Company Incorporation', category: 'ROC', defaultPrice: 12000 }),
      Service.create({ organizationId: org._id, serviceName: 'Statutory Tax Audit', category: 'Audit', defaultPrice: 35000 }),

      DocumentCategory.create({ organizationId: org._id, name: 'Registration Certificates', code: 'REG_CERT' }),
      DocumentCategory.create({ organizationId: org._id, name: 'Sales & Purchase Invoices', code: 'INV_SALES' }),
      DocumentCategory.create({ organizationId: org._id, name: 'Bank Statements', code: 'BANK_STMT' }),
      DocumentCategory.create({ organizationId: org._id, name: 'TDS & Tax Challans', code: 'TAX_CHALLAN' }),
      DocumentCategory.create({ organizationId: org._id, name: 'Filed Acknowledgments (ITR-V/ARN)', code: 'FILED_ACK' }),
    ]);

    console.log('[Seeder] Creating 248 Clients...');
    // Seed key screenshot clients first
    const keyClients = [
      {
        name: 'ABC Traders',
        businessName: 'ABC Traders Proprietorship',
        clientType: 'Business' as const,
        businessType: 'Proprietorship' as const,
        pan: 'AABCA1234F',
        gstin: '19AABCA1234F1Z1',
        email: 'contact@abctraders.in',
        mobile: '9830112233',
        contactPerson: 'Amitabh Bose',
      },
      {
        name: 'XYZ Pvt Ltd',
        businessName: 'XYZ Technologies Private Limited',
        clientType: 'Company' as const,
        businessType: 'Private Limited' as const,
        pan: 'AAACX5678G',
        gstin: '27AAACX5678G1Z2',
        email: 'finance@xyztech.com',
        mobile: '9820556677',
        contactPerson: 'Vikramaditya Roy',
      },
      {
        name: 'Global Solutions',
        businessName: 'Global Solutions Enterprises',
        clientType: 'Company' as const,
        businessType: 'Public Limited' as const,
        pan: 'AABCG9999K',
        gstin: '07AABCG9999K1Z5',
        email: 'accounts@globalsolutions.org',
        mobile: '9811889900',
        contactPerson: 'Sunil Khanna',
      },
      {
        name: 'Sunrise Infotech',
        businessName: 'Sunrise Infotech LLP',
        clientType: 'LLP' as const,
        businessType: 'LLP' as const,
        pan: 'AAACS1111L',
        gstin: '24AAACS1111L1Z9',
        email: 'info@sunriseinfotech.in',
        mobile: '9722334455',
        contactPerson: 'Chetan Parekh',
      },
      {
        name: 'Rajesh Sharma',
        businessName: 'Sharma Enterprise',
        clientType: 'Individual' as const,
        businessType: 'Proprietorship' as const,
        pan: 'ABCDE1234F',
        gstin: '22ABCDE1234F1Z5',
        email: 'rajesh@example.com',
        mobile: '9876543210',
        contactPerson: 'Rajesh Sharma',
      },
    ];

    const clientDocs: any[] = [];
    keyClients.forEach((kc, i) => {
      clientDocs.push({
        organizationId: org._id,
        clientCode: `CL-${String(i + 1).padStart(4, '0')}`,
        ...kc,
        financialYearId: fy2026._id,
        assignedEmployeeId: empAdmin._id,
        status: 'active',
      });
    });

    const industries = ['Textiles', 'Software', 'Manufacturing', 'Logistics', 'Retail', 'Consulting', 'Real Estate', 'Healthcare'];
    const cities = ['Kolkata', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Ahmedabad', 'Pune', 'Hyderabad', 'Jaipur', 'Surat'];
    const clientTypes: any[] = ['Individual', 'Business', 'Company', 'Partnership', 'LLP'];
    const businessTypes: any[] = ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP'];

    // Generate remaining 243 clients to reach exactly 248 total clients
    for (let i = 6; i <= 248; i++) {
      const cType = clientTypes[i % clientTypes.length];
      const bType = businessTypes[i % businessTypes.length];
      const city = cities[i % cities.length];
      const ind = industries[i % industries.length];
      const panLetters = String.fromCharCode(65 + (i % 26), 65 + ((i * 2) % 26), 65 + ((i * 3) % 26), 67, 65 + (i % 26));
      const panNum = String(1000 + i).slice(-4);
      const panLast = String.fromCharCode(65 + ((i * 5) % 26));
      const pan = `${panLetters}${panNum}${panLast}`;
      const stateCode = String((i % 28) + 1).padStart(2, '0');
      const gstin = `${stateCode}${pan}1Z${i % 9}`;

      clientDocs.push({
        organizationId: org._id,
        clientCode: `CL-${String(i).padStart(4, '0')}`,
        clientType: cType,
        businessType: bType,
        name: `Client ${i} ${ind}`,
        businessName: `${ind} Partners ${i}`,
        pan,
        gstin,
        email: `client${i}@ca-compliance.in`,
        mobile: `98${String(10000000 + i * 37).slice(-8)}`,
        contactPerson: `Manager ${i}`,
        industry: ind,
        address: { city, state: 'West Bengal', country: 'India' },
        financialYearId: fy2026._id,
        assignedEmployeeId: [empAdmin._id, empAnita._id, empVikram._id, empPriya._id][i % 4],
        status: 'active',
      });
    }

    const createdClients = await Client.insertMany(clientDocs);
    console.log(`[Seeder] Seeded ${createdClients.length} clients!`);

    console.log('[Seeder] Creating Work Assignments to achieve exact KPI targets...');
    // Target KPIs:
    // Total Clients: 248
    // Pending Works: 86
    // Completed Filings: 602
    // Upcoming Deadlines: 24
    // Overdue: ~15 (resulting in 92% Completed, 6% Pending, 2% Overdue)

    const workDocs: any[] = [];
    const employeesList = [empAdmin, empAnita, empVikram, empPriya, empArjun, empNandita];

    // Specific screenshot Upcoming Deadlines:
    // 1: GSTR-1 (GST) - ABC Traders - 11 Nov 2026 - Upcoming
    // 2: TDS Return - XYZ Pvt Ltd - 15 Nov 2026 - Upcoming
    // 3: ITR Filing - Global Solutions - 31 Dec 2026 - Upcoming
    // 4: GSTR-3B (GST) - Sunrise Infotech - 20 Nov 2026 - Upcoming
    const specificUpcoming = [
      { clientIndex: 0, workIndex: 0, due: new Date('2026-11-11'), prio: 'High' },
      { clientIndex: 1, workIndex: 2, due: new Date('2026-11-15'), prio: 'Medium' },
      { clientIndex: 2, workIndex: 1, due: new Date('2026-12-31'), prio: 'High' },
      { clientIndex: 3, workIndex: 0, due: new Date('2026-11-20'), prio: 'Urgent' },
    ];

    specificUpcoming.forEach((su, idx) => {
      workDocs.push({
        organizationId: org._id,
        workCode: `WRK-2026-${String(idx + 1).padStart(4, '0')}`,
        clientId: createdClients[su.clientIndex]._id,
        workMasterId: workMasters[su.workIndex]._id,
        employeeId: employeesList[idx % employeesList.length]._id,
        assignedBy: userAdmin._id,
        startDate: new Date('2026-11-01'),
        dueDate: su.due,
        priority: su.prio as any,
        status: 'Pending',
        remarks: 'Mandatory statutory compliance filing',
        financialYearId: fy2026._id,
      });
    });

    // 20 more upcoming deadlines within next 30 days (total 24 upcoming deadlines)
    for (let i = 5; i <= 24; i++) {
      const client = createdClients[i % 248];
      const wm = workMasters[i % 4];
      const emp = employeesList[i % employeesList.length];
      const dayOffset = (i % 25) + 2;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dayOffset);

      workDocs.push({
        organizationId: org._id,
        workCode: `WRK-2026-${String(i).padStart(4, '0')}`,
        clientId: client._id,
        workMasterId: wm._id,
        employeeId: emp._id,
        assignedBy: userAdmin._id,
        startDate: new Date(),
        dueDate,
        priority: ['Medium', 'High', 'Urgent'][i % 3] as any,
        status: 'Pending',
        remarks: 'Scheduled routine statutory compliance',
        financialYearId: fy2026._id,
      });
    }

    // Remaining Pending Works to total exactly 86 pending works (24 + 62 = 86)
    for (let i = 25; i <= 86; i++) {
      const client = createdClients[i % 248];
      const wm = workMasters[i % 4];
      const emp = employeesList[i % employeesList.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 35 + (i % 30));

      workDocs.push({
        organizationId: org._id,
        workCode: `WRK-2026-${String(i).padStart(4, '0')}`,
        clientId: client._id,
        workMasterId: wm._id,
        employeeId: emp._id,
        assignedBy: userAdmin._id,
        startDate: new Date(),
        dueDate,
        priority: ['Low', 'Medium', 'High'][i % 3] as any,
        status: i % 2 === 0 ? 'In Progress' : 'Pending',
        financialYearId: fy2026._id,
      });
    }

    // 602 Completed Filings
    for (let i = 87; i <= 688; i++) {
      const client = createdClients[i % 248];
      const wm = workMasters[i % 4];
      const emp = employeesList[i % employeesList.length];
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - (i % 90) - 2);

      workDocs.push({
        organizationId: org._id,
        workCode: `WRK-2026-${String(i).padStart(4, '0')}`,
        clientId: client._id,
        workMasterId: wm._id,
        employeeId: emp._id,
        assignedBy: userAdmin._id,
        startDate: new Date(pastDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        dueDate: pastDate,
        priority: 'Medium',
        status: i % 3 === 0 ? 'Filed' : 'Completed',
        completedAt: pastDate,
        filedAt: pastDate,
        filingReference: `ARN-26${String(10000000 + i * 47).slice(-8)}`,
        financialYearId: fy2026._id,
      });
    }

    // 15 Overdue works (to give ~2% overdue)
    for (let i = 689; i <= 703; i++) {
      const client = createdClients[i % 248];
      const wm = workMasters[i % 4];
      const emp = employeesList[i % employeesList.length];
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - (i % 10) - 1);

      workDocs.push({
        organizationId: org._id,
        workCode: `WRK-2026-${String(i).padStart(4, '0')}`,
        clientId: client._id,
        workMasterId: wm._id,
        employeeId: emp._id,
        assignedBy: userAdmin._id,
        startDate: new Date(overdueDate.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: overdueDate,
        priority: 'Urgent',
        status: 'Overdue',
        remarks: 'Client documents pending verification',
        financialYearId: fy2026._id,
      });
    }

    await WorkAssignment.insertMany(workDocs);
    console.log(`[Seeder] Seeded ${workDocs.length} work assignments!`);

    console.log('[Seeder] Creating Recent Activities matching screenshot...');
    await Promise.all([
      ActivityLog.create({
        organizationId: org._id,
        actorId: userAdmin._id,
        actorName: 'Anita Desai',
        action: 'GSTR-1 filed for ABC Traders',
        entityType: 'Work',
        details: 'GSTR-1 successfully filed on GST Portal. ARN: ARN-26998811',
        icon: 'check-circle',
        color: 'green',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      }),
      ActivityLog.create({
        organizationId: org._id,
        actorId: userAdmin._id,
        actorName: 'Tosif Raza',
        action: 'New client registered: XYZ Pvt Ltd',
        entityType: 'Client',
        details: 'Registered under Private Limited company category.',
        icon: 'user-plus',
        color: 'blue',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      }),
      ActivityLog.create({
        organizationId: org._id,
        actorId: userAdmin._id,
        actorName: 'System',
        action: 'Payment received from Global Solutions',
        entityType: 'Payment',
        details: 'Received ₹15,000 for Corporate ITR filing via Bank Transfer.',
        icon: 'dollar-sign',
        color: 'orange',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      }),
      ActivityLog.create({
        organizationId: org._id,
        actorId: userAdmin._id,
        actorName: 'Vikram Roy',
        action: 'ITR-6 drafted for Sunrise Infotech',
        entityType: 'Work',
        details: 'Sent for CA partner review.',
        icon: 'file-text',
        color: 'purple',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      }),
    ]);

    console.log('[Seeder] Creating Notifications & Sample Payments...');
    await Promise.all([
      Notification.create({
        organizationId: org._id,
        userId: userAdmin._id,
        type: 'alert',
        title: 'Approaching Due Date',
        message: 'GSTR-1 for ABC Traders is due in 3 days.',
        isRead: false,
      }),
      Notification.create({
        organizationId: org._id,
        userId: userAdmin._id,
        type: 'info',
        title: 'New Client Onboarded',
        message: 'XYZ Pvt Ltd was registered successfully.',
        isRead: false,
      }),
      Notification.create({
        organizationId: org._id,
        userId: userAdmin._id,
        type: 'success',
        title: 'Filing Approved',
        message: 'ITR Filing for Global Solutions has been verified.',
        isRead: false,
      }),

      Payment.create({
        organizationId: org._id,
        paymentCode: 'PAY-2026-0001',
        clientId: createdClients[0]._id,
        invoiceNumber: 'INV-2026-001',
        amount: 4999,
        paidAmount: 4999,
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        status: 'Paid',
        reference: 'UPI-987654321012',
      }),
      Payment.create({
        organizationId: org._id,
        paymentCode: 'PAY-2026-0002',
        clientId: createdClients[1]._id,
        invoiceNumber: 'INV-2026-002',
        amount: 15000,
        paidAmount: 15000,
        paymentDate: new Date(),
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        reference: 'NEFT-AXIS998877',
      }),
      Payment.create({
        organizationId: org._id,
        paymentCode: 'PAY-2026-0003',
        clientId: createdClients[2]._id,
        invoiceNumber: 'INV-2026-003',
        amount: 8500,
        paidAmount: 4000,
        paymentDate: new Date(),
        paymentMethod: 'Bank Transfer',
        status: 'Partial',
        reference: 'IMPS-HDFC112233',
      }),
    ]);

    console.log('[Seeder] Creating Tax Filings with compliance & reconciliation data...');
    const filingDocs = [
      {
        organizationId: org._id,
        taxRuleId: taxes[0]._id, // GSTR-1
        clientId: createdClients[0]._id, // ABC Traders
        financialYearId: fy2026._id,
        periodFrom: new Date('2026-10-01'),
        periodTo: new Date('2026-10-31'),
        filingPeriod: 'Oct 2026',
        originalDueDate: new Date('2026-11-11'),
        effectiveDueDate: new Date('2026-11-11'),
        actualSubmissionDate: new Date('2026-11-10'),
        filingStatus: 'Filed',
        acknowledgementNumber: 'ARN-AA2610260012948',
        submissionMethod: 'Portal',
        submittedBy: 'Anita Desai',
        filingRemarks: 'Monthly GSTR-1 filed smoothly without notices',
        assignedEmployeeId: empAnita._id,
        reconciliationRequired: true,
        reconciliationType: 'GSTR-1 vs Sales Register',
        reconciliationStatus: 'Reconciled',
        reconciliationStartDate: new Date('2026-11-05'),
        reconciliationCompletionDate: new Date('2026-11-09'),
        amountAsPerBooks: 285400,
        amountAsPerStatement: 285400,
        differenceAmount: 0,
        reconciledBy: 'Anita Desai',
        priority: 'High',
      },
      {
        organizationId: org._id,
        taxRuleId: taxes[1]._id, // GSTR-3B
        clientId: createdClients[0]._id, // ABC Traders
        financialYearId: fy2026._id,
        periodFrom: new Date('2026-10-01'),
        periodTo: new Date('2026-10-31'),
        filingPeriod: 'Oct 2026',
        originalDueDate: new Date('2026-11-20'),
        extendedDueDate: new Date('2026-11-28'),
        effectiveDueDate: new Date('2026-11-28'),
        extensionReason: 'GST portal maintenance window extension as per Notification No. 42/2026-CT',
        extensionReference: 'CBIC-42/2026',
        extensionHistory: [
          {
            previousDueDate: new Date('2026-11-20'),
            newDueDate: new Date('2026-11-28'),
            reason: 'GST portal maintenance window extension as per Notification No. 42/2026-CT',
            reference: 'CBIC-42/2026',
            changedBy: 'Tosif Raza',
            changedAt: new Date('2026-11-18'),
          },
        ],
        filingStatus: 'In Progress',
        assignedEmployeeId: empAnita._id,
        reconciliationRequired: true,
        reconciliationType: 'GSTR-2B vs Purchase Register',
        reconciliationStatus: 'Under Review',
        amountAsPerBooks: 145000,
        amountAsPerStatement: 142000,
        differenceAmount: 3000,
        reconciledBy: 'Anita Desai',
        priority: 'Critical',
      },
      {
        organizationId: org._id,
        taxRuleId: taxes[0]._id, // GSTR-1
        clientId: createdClients[1]._id, // XYZ Technologies
        financialYearId: fy2026._id,
        periodFrom: new Date('2026-11-01'),
        periodTo: new Date('2026-11-30'),
        filingPeriod: 'Nov 2026',
        originalDueDate: new Date('2026-12-11'),
        effectiveDueDate: new Date('2026-12-11'),
        filingStatus: 'Ready to File',
        assignedEmployeeId: empAdmin._id,
        reconciliationRequired: true,
        reconciliationType: 'Books vs Filed Return',
        reconciliationStatus: 'Reconciled',
        amountAsPerBooks: 520000,
        amountAsPerStatement: 520000,
        differenceAmount: 0,
        reconciledBy: 'Tosif Raza',
        priority: 'Medium',
      },
      {
        organizationId: org._id,
        taxRuleId: taxes[1]._id, // GSTR-3B
        clientId: createdClients[2]._id, // Global Solutions
        financialYearId: fy2026._id,
        periodFrom: new Date('2026-07-01'),
        periodTo: new Date('2026-09-30'),
        filingPeriod: 'Q2 2026-27',
        originalDueDate: new Date('2026-10-31'),
        effectiveDueDate: new Date('2026-10-31'),
        actualSubmissionDate: new Date('2026-10-29'),
        filingStatus: 'Filed',
        acknowledgementNumber: 'TDS-26Q-99881122',
        submissionMethod: 'Utility',
        submittedBy: 'Vikram Roy',
        assignedEmployeeId: empVikram._id,
        reconciliationRequired: true,
        reconciliationType: 'TDS vs Form 26AS',
        reconciliationStatus: 'Reconciled',
        amountAsPerBooks: 82500,
        amountAsPerStatement: 82500,
        differenceAmount: 0,
        reconciledBy: 'Vikram Roy',
        priority: 'Medium',
      },
      {
        organizationId: org._id,
        taxRuleId: taxes[0]._id, // GSTR-1
        clientId: createdClients[3]._id, // Sunrise Infotech
        financialYearId: fy2026._id,
        periodFrom: new Date('2026-10-01'),
        periodTo: new Date('2026-10-31'),
        filingPeriod: 'Oct 2026',
        originalDueDate: new Date('2026-11-11'),
        effectiveDueDate: new Date('2026-11-11'),
        filingStatus: 'In Progress',
        assignedEmployeeId: empPriya._id,
        reconciliationRequired: true,
        reconciliationType: 'GSTR-2B vs Purchase Register',
        reconciliationStatus: 'Mismatch',
        amountAsPerBooks: 345000,
        amountAsPerStatement: 320000,
        differenceAmount: 25000,
        reconciledBy: 'Priya Mehta',
        reconciliationRemarks: 'Invoice from vendor SteelCorp not reflected in GSTR-2B',
        priority: 'High',
      },
      {
        organizationId: org._id,
        taxRuleId: taxes[0]._id, // GSTR-1
        clientId: createdClients[4]._id, // Rajesh Sharma
        financialYearId: fy2026._id,
        periodFrom: new Date('2025-04-01'),
        periodTo: new Date('2026-03-31'),
        filingPeriod: 'AY 2026-27',
        originalDueDate: new Date('2026-07-31'),
        extendedDueDate: new Date('2026-08-31'),
        effectiveDueDate: new Date('2026-08-31'),
        extensionReason: 'CBDT circular extending non-audit ITR filing deadline',
        extensionReference: 'CBDT-CIR-08/2026',
        actualSubmissionDate: new Date('2026-08-25'),
        filingStatus: 'Filed',
        acknowledgementNumber: 'ITR-ACK-110022334455',
        assignedEmployeeId: empArjun._id,
        reconciliationRequired: false,
        reconciliationStatus: 'Not Required',
        amountAsPerBooks: 0,
        amountAsPerStatement: 0,
        differenceAmount: 0,
        priority: 'Low',
      },
    ];

    await TaxFiling.insertMany(filingDocs);
    console.log(`[Seeder] Seeded ${filingDocs.length} compliance tax filings!`);

    console.log('[Seeder] Database seeding successfully completed!');
    console.log('----------------------------------------------------');
    console.log('Login credentials:');
    console.log('  Email: tosif@rizassociates.com');
    console.log('  Password: Password123!');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1] && process.argv[1].includes('seed')) {
  seedDatabase().then(async () => {
    await closeDB();
    process.exit(0);
  });
}
