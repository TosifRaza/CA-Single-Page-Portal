import { prisma } from '../config/prisma.js';

type PopulateRequest = { path: string; select?: string };
type QueryKind = 'many' | 'one' | 'update' | 'delete';

const delegates: Record<string, any> = {
  Organization: prisma.organization,
  User: prisma.user,
  Employee: prisma.employee,
  FinancialYear: prisma.financialYear,
  Branch: prisma.branch,
  Service: prisma.service,
  Client: prisma.client,
  TaxGroup: prisma.taxGroup,
  TaxMaster: prisma.taxMaster,
  WorkMaster: prisma.workMaster,
  WorkAssignment: prisma.workAssignment,
  DocumentCategory: prisma.documentCategory,
  Document: prisma.document,
  Payment: prisma.payment,
  Notification: prisma.notification,
  ActivityLog: prisma.activityLog,
  TaxFiling: prisma.taxFiling,
};

const relationTargets: Record<string, Record<string, string>> = {
  Branch: { managerId: 'Employee' },
  Client: { assignedEmployeeId: 'Employee', financialYearId: 'FinancialYear' },
  Employee: { branchId: 'Branch', managerId: 'Employee' },
  WorkMaster: { taxId: 'TaxMaster' },
  WorkAssignment: {
    clientId: 'Client',
    workMasterId: 'WorkMaster',
    employeeId: 'Employee',
    assignedBy: 'User',
  },
  Document: {
    clientId: 'Client',
    workAssignmentId: 'WorkAssignment',
    categoryId: 'DocumentCategory',
    uploadedBy: 'User',
  },
  Payment: { clientId: 'Client', workAssignmentId: 'WorkAssignment' },
  TaxFiling: {
    clientId: 'Client',
    taxRuleId: 'TaxMaster',
    assignedEmployeeId: 'Employee',
  },
};

const jsonArrayDefaults: Record<string, string[]> = {
  Employee: ['permissions'],
  TaxGroup: ['applicableClientTypes', 'reconciliationTypes'],
  TaxMaster: ['applicableClientTypes', 'filingSchedule'],
  WorkMaster: ['defaultChecklist', 'defaultDocuments', 'defaultDocumentFiles'],
  WorkAssignment: ['checklist'],
  DocumentCategory: ['allowedTypes'],
  TaxFiling: ['extensionHistory', 'documentIds', 'reminderDays'],
};

const dateFields: Record<string, string[]> = {
  Organization: ['createdAt', 'updatedAt'],
  User: ['lastLogin', 'createdAt', 'updatedAt'],
  Employee: ['joiningDate', 'createdAt', 'updatedAt'],
  FinancialYear: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
  Branch: ['createdAt', 'updatedAt'],
  Service: ['createdAt', 'updatedAt'],
  Client: ['incorporationDate', 'businessStartDate', 'createdAt', 'updatedAt'],
  TaxGroup: ['createdAt', 'updatedAt'],
  TaxMaster: [
    'periodFrom', 'periodTo', 'originalDueDate', 'extendedDueDate', 'effectiveDueDate',
    'submissionDate', 'actualSubmissionDate', 'reconciliationDate', 'createdAt', 'updatedAt',
  ],
  WorkMaster: ['createdAt', 'updatedAt'],
  WorkAssignment: ['startDate', 'dueDate', 'completedAt', 'filedAt', 'createdAt', 'updatedAt'],
  DocumentCategory: ['createdAt', 'updatedAt'],
  Document: ['createdAt', 'updatedAt'],
  Payment: ['paymentDate', 'createdAt', 'updatedAt'],
  Notification: ['createdAt'],
  ActivityLog: ['createdAt'],
  TaxFiling: [
    'periodFrom', 'periodTo', 'originalDueDate', 'extendedDueDate', 'effectiveDueDate',
    'actualSubmissionDate', 'reconciliationStartDate', 'reconciliationCompletionDate',
    'createdAt', 'updatedAt',
  ],
};

const mapIdKey = (key: string) => (key === '_id' ? 'id' : key);

const convertCondition = (condition: any): any => {
  if (Array.isArray(condition)) return condition.map(convertCondition);
  if (condition instanceof RegExp) return { contains: condition.source };
  if (!condition || typeof condition !== 'object' || condition instanceof Date) return condition;
  const converted: Record<string, any> = {};
  for (const [operator, value] of Object.entries(condition)) {
    if (operator === '$ne') converted.not = value;
    else if (operator === '$in') converted.in = value;
    else if (operator === '$nin') converted.notIn = value;
    else if (operator === '$gte') converted.gte = value;
    else if (operator === '$gt') converted.gt = value;
    else if (operator === '$lte') converted.lte = value;
    else if (operator === '$lt') converted.lt = value;
    else if (operator === '$exists') {
      if (value) converted.not = null;
      else return null;
    }
    else if (operator === '$regex') {
      const pattern = String(value).replace(/^\^|\$$/g, '').replace(/\.\*/g, '');
      converted.contains = pattern;
    } else if (operator === '$options') {
      continue;
    } else if (operator === '$or') {
      converted.OR = (value as any[]).map(convertWhere);
    } else if (operator === '$and') {
      converted.AND = (value as any[]).map(convertWhere);
    } else {
      converted[mapIdKey(operator)] = convertCondition(value);
    }
  }
  return converted;
};

const convertWhere = (filter: Record<string, any> = {}): Record<string, any> => {
  const where: Record<string, any> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or') where.OR = (value as any[]).map(convertWhere);
    else if (key === '$and') where.AND = (value as any[]).map(convertWhere);
    else where[mapIdKey(key)] = convertCondition(value);
  }
  return where;
};

const cleanData = (modelName: string, input: any): Record<string, any> => {
  const source = input?.$set ? { ...input.$set } : { ...(input || {}) };
  delete source._id;
  delete source.__v;
  if (source.id === undefined) delete source.id;
  for (const key of jsonArrayDefaults[modelName] || []) {
    if (source[key] === undefined) source[key] = [];
  }

  if (modelName === 'TaxMaster') {
    source.frequency ??= source.filingFrequency;
    source.filingFrequency ??= source.frequency;
    source.effectiveDueDate = source.extendedDueDate || source.originalDueDate || source.effectiveDueDate;
    source.submissionDate ??= source.actualSubmissionDate;
    source.actualSubmissionDate ??= source.submissionDate;
  }
  if (modelName === 'TaxFiling') {
    source.effectiveDueDate = source.extendedDueDate || source.originalDueDate || source.effectiveDueDate;
    source.amountAsPerBooks = Number(source.amountAsPerBooks) || 0;
    source.amountAsPerStatement = Number(source.amountAsPerStatement) || 0;
    source.differenceAmount = source.reconciliationRequired
      ? Math.round((source.amountAsPerBooks - source.amountAsPerStatement) * 100) / 100
      : 0;
  }

  for (const field of dateFields[modelName] || []) {
    const value = source[field];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') {
      source[field] = null;
      continue;
    }
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) throw new Error(`${modelName}.${field} must be a valid date`);
      continue;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error(`${modelName}.${field} must be a valid date`);
    source[field] = parsed;
  }

  return source;
};

const decorate = (modelName: string, row: any): any => {
  if (row === null || row === undefined) return row;
  if (Array.isArray(row)) return row.map((item) => decorate(modelName, item));
  if (typeof row !== 'object' || row instanceof Date) return row;
  const result: Record<string, any> = { ...row, _id: row.id ?? row._id };
  Object.defineProperties(result, {
    toObject: {
      enumerable: false,
      value: () => ({ ...result }),
    },
    save: {
      enumerable: false,
      value: async () => {
        const delegate = delegates[modelName];
        const data = cleanData(modelName, result);
        const updated = await delegate.update({ where: { id: result._id }, data });
        Object.assign(result, decorate(modelName, updated));
        return result;
      },
    },
  });
  return result;
};

const parseSelection = (selection?: string): { include?: Record<string, true>; exclude: string[] } => {
  if (!selection?.trim()) return { exclude: [] };
  const tokens = selection.trim().split(/\s+/);
  const excludes = tokens.filter((token) => token.startsWith('-')).map((token) => token.slice(1));
  const includes = tokens.filter((token) => !token.startsWith('-'));
  return {
    include: includes.length ? Object.fromEntries(['id', ...includes.map(mapIdKey)].map((key) => [key, true])) : undefined,
    exclude: excludes,
  };
};

class PrismaQuery implements PromiseLike<any> {
  private orderBy?: Array<Record<string, 'asc' | 'desc'>>;
  private offset?: number;
  private take?: number;
  private readonly populateRequests: PopulateRequest[] = [];
  private selection?: string;

  constructor(
    private readonly modelName: string,
    private readonly kind: QueryKind,
    private readonly filter: Record<string, any> = {},
    private readonly updateData?: Record<string, any>,
    private readonly id?: string
  ) {}

  sort(sort: Record<string, 1 | -1 | 'asc' | 'desc'>) {
    this.orderBy = Object.entries(sort).map(([key, direction]) => ({
      [mapIdKey(key)]: direction === -1 ? 'desc' : direction === 1 ? 'asc' : direction,
    }));
    return this;
  }

  skip(amount: number) {
    this.offset = amount;
    return this;
  }

  limit(amount: number) {
    this.take = amount;
    return this;
  }

  populate(path: string, selection?: string) {
    this.populateRequests.push({ path, select: selection });
    return this;
  }

  select(selection: string) {
    this.selection = selection;
    return this;
  }

  private async applyPopulate(rows: any[]): Promise<any[]> {
    let populated = rows;
    for (const request of this.populateRequests) {
      const targetName = relationTargets[this.modelName]?.[request.path];
      if (!targetName) continue;
      const targetDelegate = delegates[targetName];
      const ids = [...new Set(populated.map((row) => row[request.path]).filter(Boolean))];
      if (!ids.length) {
        populated = populated.map((row) => ({ ...row, [request.path]: null }));
        continue;
      }
      const targetSelection = parseSelection(request.select);
      const related = await targetDelegate.findMany({
        where: { id: { in: ids } },
        ...(targetSelection.include ? { select: targetSelection.include } : {}),
      });
      const relatedById = new Map(related.map((row: any) => [row.id, decorate(targetName, row)]));
      populated = populated.map((row) => ({
        ...row,
        [request.path]: relatedById.get(row[request.path]) || null,
      }));
    }
    return populated;
  }

  private async execute(): Promise<any> {
    const delegate = delegates[this.modelName];
    if (!delegate) throw new Error(`No Prisma delegate is registered for ${this.modelName}`);
    const where = this.id !== undefined ? { id: this.id } : convertWhere(this.filter);
    const projection = parseSelection(this.selection);
    const select = projection.include;

    if (this.kind === 'delete') {
      const existing = await delegate.findFirst({ where });
      if (!existing) return null;
      await delegate.delete({ where: { id: existing.id } });
      return decorate(this.modelName, existing);
    }

    if (this.kind === 'update') {
      const existing = await delegate.findFirst({ where });
      if (!existing) return null;
      const updated = await delegate.update({
        where: { id: existing.id },
        data: cleanData(this.modelName, this.updateData),
      });
      const [populated] = await this.applyPopulate([updated]);
      return this.applyProjection(decorate(this.modelName, populated), projection.exclude);
    }

    let rows: any[];
    if (this.kind === 'one') {
      const row = await delegate.findFirst({
        where,
        ...(this.orderBy ? { orderBy: this.orderBy } : {}),
        ...(select ? { select } : {}),
      });
      rows = row ? [row] : [];
    } else {
      rows = await delegate.findMany({
        where,
        ...(this.orderBy ? { orderBy: this.orderBy } : {}),
        ...(this.offset !== undefined ? { skip: this.offset } : {}),
        ...(this.take !== undefined ? { take: this.take } : {}),
        ...(select ? { select } : {}),
      });
    }
    rows = await this.applyPopulate(rows);
    const result = rows.map((row) => this.applyProjection(decorate(this.modelName, row), projection.exclude));
    return this.kind === 'one' ? result[0] ?? null : result;
  }

  private applyProjection(row: any, excluded: string[]) {
    if (!row || !excluded.length) return row;
    for (const key of excluded) delete row[key];
    return row;
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const createPrismaModel = (modelName: string) => ({
  find: (filter: Record<string, any> = {}) => new PrismaQuery(modelName, 'many', filter),
  findOne: (filter: Record<string, any> = {}) => new PrismaQuery(modelName, 'one', filter),
  findById: (id?: string) => id ? new PrismaQuery(modelName, 'one', {}, undefined, id) : Promise.resolve(null),
  findOneAndUpdate: (filter: Record<string, any>, update: Record<string, any>) =>
    new PrismaQuery(modelName, 'update', filter, update),
  findByIdAndUpdate: (id: string, update: Record<string, any>) =>
    new PrismaQuery(modelName, 'update', {}, update, id),
  findOneAndDelete: (filter: Record<string, any>) => new PrismaQuery(modelName, 'delete', filter),
  countDocuments: (filter: Record<string, any> = {}) => delegates[modelName].count({ where: convertWhere(filter) }),
  exists: async (filter: Record<string, any> = {}) =>
    Boolean(await delegates[modelName].findFirst({ where: convertWhere(filter), select: { id: true } })),
  create: async (data: any): Promise<any> => {
    if (Array.isArray(data)) return Promise.all(data.map((item) => createPrismaModel(modelName).create(item)));
    const row = await delegates[modelName].create({ data: cleanData(modelName, data) });
    return decorate(modelName, row);
  },
  insertMany: async (data: any[]) => Promise.all(data.map((item) => createPrismaModel(modelName).create(item))),
  updateMany: (filter: Record<string, any>, update: Record<string, any>) =>
    delegates[modelName].updateMany({ where: convertWhere(filter), data: cleanData(modelName, update) }),
  deleteMany: (filter: Record<string, any> = {}) => delegates[modelName].deleteMany({ where: convertWhere(filter) }),
  deleteOne: async (filter: Record<string, any> = {}) => {
    const existing = await delegates[modelName].findFirst({ where: convertWhere(filter) });
    if (!existing) return { deletedCount: 0 };
    await delegates[modelName].delete({ where: { id: existing.id } });
    return { deletedCount: 1 };
  },
});

export const Organization = createPrismaModel('Organization') as any;
export const User = createPrismaModel('User') as any;
export const Employee = createPrismaModel('Employee') as any;
export const FinancialYear = createPrismaModel('FinancialYear') as any;
export const Branch = createPrismaModel('Branch') as any;
export const Service = createPrismaModel('Service') as any;
export const Client = createPrismaModel('Client') as any;
export const TaxGroup = createPrismaModel('TaxGroup') as any;
export const TaxMaster = createPrismaModel('TaxMaster') as any;
export const WorkMaster = createPrismaModel('WorkMaster') as any;
export const WorkAssignment = createPrismaModel('WorkAssignment') as any;
export const DocumentCategory = createPrismaModel('DocumentCategory') as any;
export const DocumentModel = createPrismaModel('Document') as any;
export const Payment = createPrismaModel('Payment') as any;
export const Notification = createPrismaModel('Notification') as any;
export const ActivityLog = createPrismaModel('ActivityLog') as any;
export const TaxFiling = createPrismaModel('TaxFiling') as any;
