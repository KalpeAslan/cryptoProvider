import { CUSTOM_CODES_MAP } from '../constants/custom-codes.constants';
import { CustomCode, CustomCodesEnum } from '../types/common.types';

export class CustomException extends Error {
  public code: number;

  constructor(errorType: CustomCodesEnum) {
    const { code, message } = CUSTOM_CODES_MAP.get(errorType) as CustomCode;
    super(message);
    this.code = code;
    this.name = 'CustomException';

    // Ensuring stack trace is captured properly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomException);
    }
  }
}
