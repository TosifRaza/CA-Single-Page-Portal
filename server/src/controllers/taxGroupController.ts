import { Request, Response, NextFunction } from 'express';
import { TaxGroup } from '../models/TaxGroup.js';
import { TaxMaster } from '../models/TaxMaster.js';
import { WorkMaster } from '../models/WorkMaster.js';
import { WorkAssignment } from '../models/WorkAssignment.js';
import { TaxFiling } from '../models/TaxFiling.js';
import { taxGroupSchema } from '../validators/index.js';

export const DEFAULT_TAX_GROUPS = [
  {
    groupName: 'GST (Goods & Services Tax)',
    groupCode: 'GST',
    description: 'Central & State Goods and Services Tax compliance (GSTR-1, 3B, 9)',
    defaultFrequency: 'Monthly',
    applicableClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'GSTR-2B vs Purchase Register',
      'GSTR-1 vs Sales Register',
      'Books vs Filed GSTR-3B',
      'Custom GST Reconciliation',
    ],
    isSystemDefault: true,
  },
  {
    groupName: 'Income Tax (ITR & Audit)',
    groupCode: 'IT',
    description: 'Direct Tax Returns, Advance Tax, and 44AB Tax Audits',
    defaultFrequency: 'Yearly',
    applicableClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust'],
    reconciliationTypes: [
      'TDS / TCS as per Books vs Form 26AS / AIS / TIS',
      'Advance Tax Paid vs Portal Challans',
      'Books Balance Sheet vs ITR Financials',
    ],
    isSystemDefault: true,
  },
  {
    groupName: 'TDS (Tax Deducted at Source)',
    groupCode: 'TDS',
    description: 'Quarterly withholding returns (24Q, 26Q, 27Q) and TRACES issuance',
    defaultFrequency: 'Quarterly',
    applicableClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'TDS Deducted in Books vs Challan 281 Paid',
      'TDS in Books vs Form 26AS / TRACES',
    ],
    isSystemDefault: true,
  },
  {
    groupName: 'TCS (Tax Collected at Source)',
    groupCode: 'TCS',
    description: 'Tax collected at source statements (Form 27EQ)',
    defaultFrequency: 'Quarterly',
    applicableClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: [
      'TCS Collected in Books vs Challan 281 Paid',
      'TCS in Books vs Form 26AS',
    ],
    isSystemDefault: true,
  },
  {
    groupName: 'ROC / MCA (Corporate Compliance)',
    groupCode: 'ROC',
    description: 'Ministry of Corporate Affairs filings (AOC-4, MGT-7, DIR-3 KYC)',
    defaultFrequency: 'Yearly',
    applicableClientTypes: ['Company', 'LLP'],
    reconciliationTypes: [
      'Audited Financial Statements vs Form AOC-4',
      'Secretarial Records vs Form MGT-7',
    ],
    isSystemDefault: true,
  },
  {
    groupName: 'PF / ESI (Labour & Payroll)',
    groupCode: 'PF_ESI',
    description: 'Employees Provident Fund and State Insurance monthly returns',
    defaultFrequency: 'Monthly',
    applicableClientTypes: ['Business', 'Company', 'Partnership', 'LLP'],
    reconciliationTypes: ['Payroll Register vs ECR Challan Paid'],
    isSystemDefault: true,
  },
  {
    groupName: 'Other / Advisory / PT',
    groupCode: 'OTHER',
    description: 'Professional Tax, Trade License, RERA and Custom Client Services',
    defaultFrequency: 'Monthly',
    applicableClientTypes: ['Individual', 'Business', 'Company', 'Partnership', 'LLP', 'Trust', 'Other'],
    reconciliationTypes: ['Bank Reconciliation', 'Books vs Third-Party Statement'],
    isSystemDefault: true,
  },
];

export const getTaxGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;
    const { status, search } = req.query;

    const query: any = { organizationId };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { groupName: { $regex: search as string, $options: 'i' } },
        { groupCode: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    let groups = await TaxGroup.find(query).sort({ isSystemDefault: -1, createdAt: 1 });

    // Aggregate linked taxes count from TaxMaster
    const organizationTaxes = await TaxMaster.find({
      organizationId,
      status: { $ne: 'Archived' },
    });
    const taxCounts = new Map<string, number>();
    organizationTaxes.forEach((tax: any) => {
      const key = String(tax.taxGroup || '').trim().toUpperCase();
      if (key) taxCounts.set(key, (taxCounts.get(key) || 0) + 1);
    });

    const countMap = taxCounts;

    const groupsWithCounts = groups.map((g: any) => {
      const gObj = g.toObject();
      const codeCount = countMap.get(g.groupCode.trim().toUpperCase()) || 0;
      const nameCount = countMap.get(g.groupName.trim().toUpperCase()) || 0;
      let count = codeCount || nameCount;
      if (g.groupCode === 'IT') {
        count = count || (countMap.get('INCOME TAX') || 0);
      }
      return {
        ...gObj,
        linkedTaxesCount: count,
      };
    });

    res.json({
      success: true,
      data: groupsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

export const createTaxGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId;

    const body = { ...req.body };
    if (!body.groupCode && body.groupName) {
      let code = body.groupName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase() || 'GRP';
      const count = await TaxGroup.countDocuments({ organizationId, groupCode: code });
      if (count > 0) code = `${code}${count + 1}`;
      body.groupCode = code;
    }

    const validated = taxGroupSchema.parse(body);

    const existing = await TaxGroup.findOne({
      organizationId,
      $or: [
        { groupCode: validated.groupCode!.toUpperCase() },
        { groupName: validated.groupName },
      ],
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Tax Group '${validated.groupName}' already exists.`,
      });
      return;
    }

    const group = await TaxGroup.create({
      ...validated,
      groupCode: validated.groupCode!.toUpperCase(),
      organizationId,
      isSystemDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Tax Group created successfully',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaxGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const group = await TaxGroup.findOneAndUpdate(
      { _id: id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!group) {
      res.status(404).json({ success: false, message: 'Tax Group not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Tax Group updated successfully',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTaxGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;

    const group = await TaxGroup.findOne({ _id: id, organizationId });
    if (!group) {
      res.status(404).json({ success: false, message: 'Tax Group not found' });
      return;
    }

    // Cascade delete: Find all linked taxes in TaxMaster
    const linkedTaxes = await TaxMaster.find({
      organizationId,
      $or: [
        { taxGroup: group.groupName },
        { taxGroup: group.groupCode },
      ],
    });

    const taxIds = linkedTaxes.map((t: any) => t._id);

    if (taxIds.length > 0) {
      const linkedWorks = await WorkMaster.find({ organizationId, taxId: { $in: taxIds } });
      const linkedWorkIds = linkedWorks.map((work: any) => work._id);
      // 1. Delete dependent Work Masters
      if (linkedWorkIds.length) await WorkMaster.deleteMany({ organizationId, _id: { $in: linkedWorkIds } });
      // 2. Delete dependent Work Assignments
      if (linkedWorkIds.length) await WorkAssignment.deleteMany({ organizationId, workMasterId: { $in: linkedWorkIds } });
      // 3. Delete dependent Tax Filings
      await TaxFiling.deleteMany({ organizationId, taxRuleId: { $in: taxIds } });
      // 4. Delete the Tax Rules themselves
      await TaxMaster.deleteMany({ organizationId, _id: { $in: taxIds } });
    }

    await TaxGroup.deleteOne({ _id: id, organizationId });

    res.json({
      success: true,
      message: `Tax Group '${group.groupName}' deleted successfully along with dependent compliance taxes.`,
    });
  } catch (error) {
    next(error);
  }
};
