import { NetworkType } from '@/modules/shared';

export enum TokensEnum {
  USDC = 'USDC',
  USDT = 'USDT',
}

type TokensMap = {
  [key in NetworkType]: {
    [key in TokensEnum]: {
      address: string;
      decimals: number;
    };
  };
};

export const TOKENS_MAP: TokensMap = {
  [NetworkType.ETHEREUM]: {
    [TokensEnum.USDC]: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimals: 6,
    },
  },
  [NetworkType.POLYGON]: {
    [TokensEnum.USDC]: {
      address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      decimals: 6,
    },
  },
  [NetworkType.MUMBAI]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 6,
    },
  },
  [NetworkType.BINANCE]: {
    [TokensEnum.USDC]: {
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      decimals: 18,
    },
    [TokensEnum.USDT]: {
      address: '0x55d398326f99059ff775485246999027b3197955',
      decimals: 18,
    },
  },
  [NetworkType.BINANCE_TESTNET]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
  },
  [NetworkType.HARDHAT]: {
    [TokensEnum.USDC]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
    [TokensEnum.USDT]: {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
    },
  },
  [NetworkType.TRON]: {
    [TokensEnum.USDC]: {
      address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      decimals: 6,
    },
  },
  [NetworkType.NILE]: {
    [TokensEnum.USDC]: {
      address: 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
      decimals: 18,
    },
    [TokensEnum.USDT]: {
      address: 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
      decimals: 18,
    },
  },
  // [NetworkType.ETH_TESTNET]: {
  //   [TokensEnum.USDC]: {
  //     address: '0x0000000000000000000000000000000000000000',
  //   },
  //   [TokensEnum.USDT]: {
  //     address: '0x0000000000000000000000000000000000000000',
  //   },
  // },
  [NetworkType.SOLANA]: {
    [TokensEnum.USDC]: {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Solana USDC mainnet
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Solana USDT mainnet
      decimals: 6,
    },
  },
  [NetworkType.SOLANA_DEVNET]: {
    [TokensEnum.USDC]: {
      address: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // from faucet token
      decimals: 6,
    },
    [TokensEnum.USDT]: {
      address: 'fyZoJQaD8QJ3RUBXVCg6zewHWQ6bvanCKJSCx9ejVgY', // custom token
      decimals: 9,
    },
  },
};
