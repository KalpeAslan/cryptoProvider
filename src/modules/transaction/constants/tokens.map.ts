import { NetworkType } from '@/modules/shared';

export enum TokensEnum {
  USDC = 'USDC',
  USDT = 'USDT',
}

type TokensMap = {
  [key in NetworkType]: {
    [key in TokensEnum]: {
      address: string;
    };
  };
};

export const TOKENS_MAP: TokensMap = {
  [NetworkType.ETHEREUM]: {
    [TokensEnum.USDC]: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    [TokensEnum.USDT]: {
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
  },
  [NetworkType.POLYGON]: {
    [TokensEnum.USDC]: {
      address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    },
    [TokensEnum.USDT]: {
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
  },
  [NetworkType.MUMBAI]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
    },
  },
  [NetworkType.BINANCE]: {
    [TokensEnum.USDC]: {
      address: '0x55d398326f99059ff775485246999027b3197955',
    },
    [TokensEnum.USDT]: {
      address: '0x55d398326f99059ff775485246999027b3197955',
    },
  },
  [NetworkType.BINANCE_TESTNET]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
    },
  },
  [NetworkType.HARDHAT]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
    },
  },
  [NetworkType.TRON]: {
    [TokensEnum.USDC]: {
      address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    },
    [TokensEnum.USDT]: {
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    },
  },
  [NetworkType.NILE]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
    },
    [TokensEnum.USDT]: {
      address: 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
    },
  },
  [NetworkType.ETH_TESTNET]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
    },
  },
};
