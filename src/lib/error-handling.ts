// Error handling utilities for better user experience

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502);
    this.name = 'ExternalServiceError';
  }
}

// Error response helper
export function createErrorResponse(error: AppError) {
  return {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
  };
}

// Validation helpers
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    error: isValid ? undefined : 'Please enter a valid email address',
  };
}

export function validateScore(score: string): { isValid: boolean; error?: string } {
  const scoreNum = parseInt(score);
  const isValid = !isNaN(scoreNum) && scoreNum >= 1 && scoreNum <= 45;
  
  return {
    isValid,
    error: isValid ? undefined : 'Score must be between 1 and 45',
  };
}

export function validateDate(date: string): { isValid: boolean; error?: string } {
  // Check for dd-mm-yyyy format
  const dateRegex = /^(0[1-9]|[12][0-9])-(0[1-9]|[12][0-9])-(\d{4})$/;
  const isValid = dateRegex.test(date);
  
  return {
    isValid,
    error: isValid ? undefined : 'Please enter a valid date in dd-mm-yyyy format',
  };
}

export function validateFileSize(file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } {
  const isValid = file.size <= maxSizeMB * 1024 * 1024;
  
  return {
    isValid,
    error: isValid ? undefined : `File size must be less than ${maxSizeMB}MB`,
  };
}

export function validateFileType(file: File, allowedTypes: string[] = ['image/']): { isValid: boolean; error?: string } {
  const isValid = allowedTypes.some(type => file.type.startsWith(type));
  
  return {
    isValid,
    error: isValid ? undefined : `Please upload an ${allowedTypes.join(' or ')} file`,
  };
}

// Safe database operation wrapper
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    console.error('Database operation error:', error);
    return { 
      error: error instanceof Error 
        ? new DatabaseError(error.message)
        : new DatabaseError(errorMessage)
    };
  }
}

// Safe API call wrapper
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  errorMessage: string = 'API call failed'
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error) {
    console.error('API call error:', error);
    return { 
      error: error instanceof Error 
        ? new ExternalServiceError(error.message)
        : new ExternalServiceError(errorMessage)
    };
  }
}
