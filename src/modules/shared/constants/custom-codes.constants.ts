import { CustomCode, CustomCodesEnum } from '../types/common.types';

export const CUSTOM_CODES: Record<CustomCodesEnum, CustomCode> = {
  /** Successful operations */
  [CustomCodesEnum.SUCCESS]: {
    code: CustomCodesEnum.SUCCESS,
    message: 'Operation successful',
  },
  [CustomCodesEnum.TRANSACTION_CREATED]: {
    code: CustomCodesEnum.TRANSACTION_CREATED,
    message: 'Transaction created',
  },
  [CustomCodesEnum.TRANSACTION_CONFIRMED]: {
    code: CustomCodesEnum.TRANSACTION_CONFIRMED,
    message: 'Transaction confirmed on blockchain',
  },
  [CustomCodesEnum.TRANSACTION_PENDING]: {
    code: CustomCodesEnum.TRANSACTION_PENDING,
    message: 'Transaction pending on blockchain',
  },

  /** Client errors (400x) */
  [CustomCodesEnum.INVALID_REQUEST]: {
    code: CustomCodesEnum.INVALID_REQUEST,
    message: 'Invalid request parameters',
  },
  [CustomCodesEnum.UNAUTHORIZED]: {
    code: CustomCodesEnum.UNAUTHORIZED,
    message: 'Unauthorized access',
  },
  [CustomCodesEnum.FORBIDDEN]: {
    code: CustomCodesEnum.FORBIDDEN,
    message: 'Forbidden operation',
  },
  [CustomCodesEnum.INVALID_ADDRESS]: {
    code: CustomCodesEnum.INVALID_ADDRESS,
    message: 'Invalid blockchain address',
  },
  [CustomCodesEnum.UNSUPPORTED_CURRENCY]: {
    code: CustomCodesEnum.UNSUPPORTED_CURRENCY,
    message: 'Unsupported currency or token',
  },
  [CustomCodesEnum.INSUFFICIENT_FUNDS]: {
    code: CustomCodesEnum.INSUFFICIENT_FUNDS,
    message: 'Insufficient funds in wallet',
  },
  [CustomCodesEnum.TRANSACTION_ALREADY_PROCESSED]: {
    code: CustomCodesEnum.TRANSACTION_ALREADY_PROCESSED,
    message: 'Transaction has already been processed',
  },
  [CustomCodesEnum.INVALID_SIGNATURE]: {
    code: CustomCodesEnum.INVALID_SIGNATURE,
    message: 'Invalid transaction signature',
  },
  [CustomCodesEnum.NONCE_TOO_LOW]: {
    code: CustomCodesEnum.NONCE_TOO_LOW,
    message: 'Nonce too low',
  },
  [CustomCodesEnum.NONCE_TOO_HIGH]: {
    code: CustomCodesEnum.NONCE_TOO_HIGH,
    message: 'Nonce too high',
  },
  [CustomCodesEnum.GAS_LIMIT_EXCEEDED]: {
    code: CustomCodesEnum.GAS_LIMIT_EXCEEDED,
    message: 'Gas limit exceeded',
  },
  [CustomCodesEnum.GAS_PRICE_TOO_LOW]: {
    code: CustomCodesEnum.GAS_PRICE_TOO_LOW,
    message: 'Gas price is too low',
  },
  [CustomCodesEnum.RATE_LIMIT_EXCEEDED]: {
    code: CustomCodesEnum.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests, rate limit exceeded',
  },
  [CustomCodesEnum.PROVIDER_NOT_FOUND]: {
    code: CustomCodesEnum.PROVIDER_NOT_FOUND,
    message: 'Provider not found',
  },

  /** Errors related to blockchain and transactions (500x) */
  [CustomCodesEnum.BLOCKCHAIN_UNAVAILABLE]: {
    code: CustomCodesEnum.BLOCKCHAIN_UNAVAILABLE,
    message: 'Blockchain network unavailable',
  },
  [CustomCodesEnum.TRANSACTION_REJECTED]: {
    code: CustomCodesEnum.TRANSACTION_REJECTED,
    message: 'Transaction rejected by the network',
  },
  [CustomCodesEnum.TRANSACTION_TIMEOUT]: {
    code: CustomCodesEnum.TRANSACTION_TIMEOUT,
    message: 'Transaction confirmation timeout',
  },
  [CustomCodesEnum.TRANSACTION_FAILED]: {
    code: CustomCodesEnum.TRANSACTION_FAILED,
    message: 'Blockchain transaction failed',
  },
  [CustomCodesEnum.CONTRACT_CALL_FAILED]: {
    code: CustomCodesEnum.CONTRACT_CALL_FAILED,
    message: 'Smart contract call failed',
  },
  [CustomCodesEnum.INSUFFICIENT_GAS]: {
    code: CustomCodesEnum.INSUFFICIENT_GAS,
    message: 'Insufficient gas for transaction',
  },
  [CustomCodesEnum.PENDING_TRANSACTION_EXISTS]: {
    code: CustomCodesEnum.PENDING_TRANSACTION_EXISTS,
    message: 'Pending transaction already exists',
  },
  [CustomCodesEnum.TRANSACTION_BROADCAST_ERROR]: {
    code: CustomCodesEnum.TRANSACTION_BROADCAST_ERROR,
    message: 'Error broadcasting transaction',
  },
  [CustomCodesEnum.INVALID_TRANSACTION_HASH]: {
    code: CustomCodesEnum.INVALID_TRANSACTION_HASH,
    message: 'Invalid transaction hash',
  },

  /** Internal service errors (600x) */
  [CustomCodesEnum.INTERNAL_ERROR]: {
    code: CustomCodesEnum.INTERNAL_ERROR,
    message: 'Internal service error',
  },
  [CustomCodesEnum.DATABASE_ERROR]: {
    code: CustomCodesEnum.DATABASE_ERROR,
    message: 'Database operation failed',
  },
  [CustomCodesEnum.CACHE_ERROR]: {
    code: CustomCodesEnum.CACHE_ERROR,
    message: 'Cache operation failed',
  },
  [CustomCodesEnum.THIRD_PARTY_SERVICE_ERROR]: {
    code: CustomCodesEnum.THIRD_PARTY_SERVICE_ERROR,
    message: 'Error in third-party service',
  },
  [CustomCodesEnum.CONFIGURATION_ERROR]: {
    code: CustomCodesEnum.CONFIGURATION_ERROR,
    message: 'Service configuration error',
  },
  [CustomCodesEnum.PROCESSING_ERROR]: {
    code: CustomCodesEnum.PROCESSING_ERROR,
    message: 'General processing error',
  },
};

export const CUSTOM_CODES_MAP = new Map<number, CustomCode>(
  Object.entries(CUSTOM_CODES).map(([key, value]) => [Number(key), value]),
);
