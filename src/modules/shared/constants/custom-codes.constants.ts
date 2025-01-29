import { CustomCode } from '../types/common.types';

export const CUSTOM_CODES: Record<string, CustomCode> = {
  /** Successful operations */
  SUCCESS: { code: 2000, message: 'Operation successful' },
  TRANSACTION_CONFIRMED: {
    code: 2001,
    message: 'Transaction confirmed on blockchain',
  },

  /** Client errors (400x) */
  INVALID_REQUEST: { code: 4001, message: 'Invalid request parameters' },
  UNAUTHORIZED: { code: 4002, message: 'Unauthorized access' },
  FORBIDDEN: { code: 4003, message: 'Forbidden operation' },
  INVALID_ADDRESS: { code: 4004, message: 'Invalid blockchain address' },
  UNSUPPORTED_CURRENCY: {
    code: 4005,
    message: 'Unsupported currency or token',
  },
  INSUFFICIENT_FUNDS: { code: 4006, message: 'Insufficient funds in wallet' },
  TRANSACTION_ALREADY_PROCESSED: {
    code: 4007,
    message: 'Transaction has already been processed',
  },
  INVALID_SIGNATURE: { code: 4008, message: 'Invalid transaction signature' },
  NONCE_TOO_LOW: { code: 4009, message: 'Nonce too low' },
  NONCE_TOO_HIGH: { code: 4010, message: 'Nonce too high' },
  GAS_LIMIT_EXCEEDED: { code: 4011, message: 'Gas limit exceeded' },
  GAS_PRICE_TOO_LOW: { code: 4012, message: 'Gas price is too low' },
  RATE_LIMIT_EXCEEDED: {
    code: 4013,
    message: 'Too many requests, rate limit exceeded',
  },
  PROVIDER_NOT_FOUND: {
    code: 4014,
    message: 'Provider not found',
  },

  /** Errors related to blockchain and transactions (500x) */
  BLOCKCHAIN_UNAVAILABLE: {
    code: 5001,
    message: 'Blockchain network unavailable',
  },
  TRANSACTION_REJECTED: {
    code: 5002,
    message: 'Transaction rejected by the network',
  },
  TRANSACTION_TIMEOUT: {
    code: 5003,
    message: 'Transaction confirmation timeout',
  },
  TRANSACTION_FAILED: { code: 5004, message: 'Blockchain transaction failed' },
  CONTRACT_CALL_FAILED: { code: 5005, message: 'Smart contract call failed' },
  INSUFFICIENT_GAS: { code: 5006, message: 'Insufficient gas for transaction' },
  PENDING_TRANSACTION_EXISTS: {
    code: 5007,
    message: 'Pending transaction already exists',
  },
  TRANSACTION_BROADCAST_ERROR: {
    code: 5008,
    message: 'Error broadcasting transaction',
  },
  INVALID_TRANSACTION_HASH: { code: 5009, message: 'Invalid transaction hash' },

  /** Internal service errors (600x) */
  INTERNAL_ERROR: { code: 6001, message: 'Internal service error' },
  DATABASE_ERROR: { code: 6002, message: 'Database operation failed' },
  CACHE_ERROR: { code: 6003, message: 'Cache operation failed' },
  THIRD_PARTY_SERVICE_ERROR: {
    code: 6004,
    message: 'Error in third-party service',
  },
  CONFIGURATION_ERROR: { code: 6005, message: 'Service configuration error' },
  PROCESSING_ERROR: { code: 6006, message: 'General processing error' },
};

export const CUSTOM_CODES_MAP = new Map<string, CustomCode>(
  Object.entries(CUSTOM_CODES),
);
