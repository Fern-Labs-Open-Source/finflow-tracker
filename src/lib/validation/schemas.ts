import { z } from 'zod';
import { AccountType, Currency } from '@prisma/client';

// User schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

// Institution schemas
export const createInstitutionSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  displayOrder: z.number().int().optional(),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

// Account schemas
export const createAccountSchema = z.object({
  institutionId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AccountType),
  currency: z.nativeEnum(Currency),
  isDerived: z.boolean().optional(),
  parentAccountId: z.string().uuid().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateAccountSchema = createAccountSchema.partial().omit({ 
  institutionId: true 
});

// Account Snapshot schemas
export const createAccountSnapshotSchema = z.object({
  accountId: z.string().uuid(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  valueOriginal: z.number().or(z.string()).transform((val) => Number(val)),
  currency: z.nativeEnum(Currency).optional(),
  notes: z.string().optional(),
});

export const bulkCreateAccountSnapshotsSchema = z.array(createAccountSnapshotSchema);

// Brokerage Entry schemas
export const createBrokerageEntrySchema = z.object({
  brokerageAccountId: z.string().uuid(),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  totalValue: z.number().or(z.string()).transform((val) => Number(val)),
  cashValue: z.number().or(z.string()).transform((val) => Number(val)),
  currency: z.nativeEnum(Currency),
});

// Portfolio query schemas
export const portfolioQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currency: z.nativeEnum(Currency).optional(),
  includeInactive: z.boolean().optional(),
});

// Exchange rate schemas
export const exchangeRateQuerySchema = z.object({
  date: z.string().or(z.date()),
  fromCurrency: z.nativeEnum(Currency),
  toCurrency: z.nativeEnum(Currency),
});

export const syncExchangeRatesSchema = z.object({
  dates: z.array(z.string().or(z.date())).optional(),
  currencies: z.array(z.nativeEnum(Currency)).optional(),
});
