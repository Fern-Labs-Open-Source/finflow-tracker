import { z } from 'zod';

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodErrors(error: z.ZodError): {
  message: string;
  fieldErrors: Record<string, string[]>;
  formattedMessage: string;
} {
  const fieldErrors: Record<string, string[]> = {};
  
  // Group errors by field path
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    
    // Create user-friendly messages based on error type
    let message = '';
    switch (err.code) {
      case 'invalid_type':
        if (err.expected === 'string' && err.received === 'undefined') {
          message = `${path || 'Field'} is required`;
        } else {
          message = `${path || 'Field'} must be a ${err.expected}`;
        }
        break;
      case 'invalid_enum_value':
        message = `${path || 'Field'} must be one of: ${err.options?.join(', ')}`;
        break;
      case 'too_small':
        if (err.type === 'string') {
          message = `${path || 'Field'} must be at least ${err.minimum} characters`;
        } else {
          message = `${path || 'Field'} must be at least ${err.minimum}`;
        }
        break;
      case 'too_big':
        if (err.type === 'string') {
          message = `${path || 'Field'} must be at most ${err.maximum} characters`;
        } else {
          message = `${path || 'Field'} must be at most ${err.maximum}`;
        }
        break;
      case 'invalid_string':
        if (err.validation === 'regex') {
          if (path.includes('color')) {
            message = `${path || 'Field'} must be a valid hex color (e.g., #FF0000)`;
          } else {
            message = `${path || 'Field'} has invalid format`;
          }
        } else if (err.validation === 'uuid') {
          message = `${path || 'Field'} must be a valid UUID`;
        } else {
          message = err.message;
        }
        break;
      default:
        message = err.message;
    }
    
    fieldErrors[path] = [...fieldErrors[path], message];
  });
  
  // Create a formatted message for all errors
  const formattedMessage = Object.entries(fieldErrors)
    .map(([field, messages]) => {
      const fieldName = field || 'Field';
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join('; ');
  
  // Create a simple message for the most important error
  const firstError = error.errors[0];
  const simpleMessage = fieldErrors[firstError.path.join('.')][0] || 'Validation failed';
  
  return {
    message: simpleMessage,
    fieldErrors,
    formattedMessage,
  };
}

/**
 * Create a standardized validation error response
 */
export function createValidationErrorResponse(error: z.ZodError) {
  const formatted = formatZodErrors(error);
  
  return {
    error: 'Validation failed',
    message: formatted.formattedMessage,
    fieldErrors: formatted.fieldErrors,
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      code: err.code,
      message: err.message,
    })),
  };
}
