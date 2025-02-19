import { TronWeb } from 'tronweb';
import { NetworkType } from '@/modules/shared';
import { TokensEnum } from '../../constants/tokens.map';
export interface NativeTransactionParams {
  wallet: TronWeb;
  from: string;
  to: string;
  amount: string | bigint;
  network: NetworkType;
}

export interface TokenTransactionParams {
  wallet: TronWeb;
  from: string;
  to: string;
  amount: string | bigint;
  token: TokensEnum;
  network: NetworkType;
}
