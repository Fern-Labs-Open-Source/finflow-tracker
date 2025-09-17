/**
 * Simple validation helpers for better error handling
 */

import { z } from 'zod';

/**
 * Parse and validate request data with friendly error messages
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: { message: string; fields?: Record<string, string[]> } }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fields: Record<string, string[]> = {};
      
      error.errors.forEach(err => {
        const field = err.path.join('.');
        if (!fields[field]) {
          fields[field] = [];
        }
        fields[field].push(err.message);
      });
      
      return {
        error: {
          message: 'Validation failed',
          fields,
        },
      };
    }
    
    return {
      error: {
        message: 'Invalid request data',
      },
    };
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  message: string,
  fields?: Record<string, string[]>
) {
  return Response.json(
    {
      error: message,
      fieldErrors: fields,
    },
    { status: 400 }
  );
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Money/currency validation
  money: z.number().positive().finite(),
  currency: z.enum(['EUR', 'GBP', 'USD', 'SEK', 'CHF']),
  
  // Account validation
  accountType: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CREDIT_CARD', 'LOAN', 'OTHER']),
  
  // Pagination
  paginationParams: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
  
  // Date range
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
};
