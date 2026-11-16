import { Request, Response, NextFunction } from 'express';
import { TaxGroup } from '../models/TaxGroup.js';
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

    res.json({
      success: true,
      data: groups,
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

    await TaxGroup.deleteOne({ _id: id, organizationId });

    res.json({
      success: true,
      message: 'Tax Group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
