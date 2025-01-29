import { CUSTOM_CODES } from '../constants/custom-codes.constants';

export class CustomException extends Error {
  public code: number;

  constructor(errorType: keyof typeof CUSTOM_CODES) {
    const { code, message } = CUSTOM_CODES[errorType];
    super(message);
    this.code = code;
    this.name = 'CustomException';

    // Ensuring stack trace is captured properly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomException);
    }
  }
}
