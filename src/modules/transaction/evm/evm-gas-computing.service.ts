import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { NetworkType } from '../../shared/types/network.types';
import { SharedConfig } from '../../shared/config/shared.config';

@Injectable()
export class EvmGasComputingService {
  constructor(private readonly SharedConfig: SharedConfig) {}

  private getProvider(network: NetworkType): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(this.SharedConfig.networks[network].rpc);
  }

  async estimateGasPrice(network: NetworkType): Promise<bigint> {
    const provider = this.getProvider(network);
    return await provider.getFeeData().then((fee) => fee.gasPrice ?? 0n);
  }

  async estimateGasLimit(
    network: NetworkType,
    from: string,
    to: string,
    amount: string,
    tokenAddress?: string,
  ): Promise<bigint> {
    const provider = this.getProvider(network);

    // For native token transfers
    if (!tokenAddress) {
      const tx = {
        from,
        to,
        value: amount,
      };
      return await provider.estimateGas(tx);
    }

    // For ERC20 transfers
    const erc20Interface = new ethers.Interface([
      'function transfer(address to, uint256 amount)',
    ]);
    const data = erc20Interface.encodeFunctionData('transfer', [to, amount]);

    const tx = {
      from,
      to: tokenAddress,
      data,
    };

    return await provider.estimateGas(tx);
  }

  async computeOptimalGas(
    network: NetworkType,
    from: string,
    to: string,
    amount: string,
    tokenAddress?: string,
    userSpecifiedGas?: number,
  ): Promise<{ gasLimit: bigint; gasPrice: bigint }> {
    const [estimatedGasLimit, currentGasPrice] = await Promise.all([
      this.estimateGasLimit(network, from, to, amount, tokenAddress),
      this.estimateGasPrice(network),
    ]);

    // Add 20% buffer to estimated gas limit for safety
    const gasLimit = userSpecifiedGas
      ? BigInt(userSpecifiedGas)
      : (estimatedGasLimit * 120n) / 100n;

    return {
      gasLimit,
      gasPrice: currentGasPrice,
    };
  }
}
