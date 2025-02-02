import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { NetworkType, SharedConfig } from '@core/shared';

@Injectable()
export class EvmGasComputingService {
  private readonly logger = new Logger(EvmGasComputingService.name);

  constructor(private readonly SharedConfig: SharedConfig) {}

  private getProvider(network: NetworkType): ethers.JsonRpcProvider {
    this.logger.log(`Creating provider for network: ${network}`);
    return new ethers.JsonRpcProvider(this.SharedConfig.networks[network].rpc);
  }

  async estimateGasPrice(network: NetworkType): Promise<bigint> {
    this.logger.log(`Estimating gas price for network: ${network}`);
    const provider = this.getProvider(network);
    const gasPrice = await provider
      .getFeeData()
      .then((fee) => fee.gasPrice ?? 0n);
    this.logger.log(`Estimated gas price: ${gasPrice}`);
    return gasPrice;
  }

  async estimateGasLimit(
    network: NetworkType,
    from: string,
    to: string,
    amount: string,
    tokenAddress?: string,
  ): Promise<bigint> {
    this.logger.log(
      `Estimating gas limit for ${tokenAddress ? 'token' : 'native'} transfer on network: ${network}`,
    );
    const provider = this.getProvider(network);

    let gasLimit: bigint;
    if (!tokenAddress) {
      const tx = {
        from,
        to,
        value: amount,
      };
      gasLimit = await provider.estimateGas(tx);
      this.logger.log(`Estimated native transfer gas limit: ${gasLimit}`);
    } else {
      const erc20Interface = new ethers.Interface([
        'function transfer(address to, uint256 amount)',
      ]);
      const data = erc20Interface.encodeFunctionData('transfer', [to, amount]);

      const tx = {
        from,
        to: tokenAddress,
        data,
      };

      gasLimit = await provider.estimateGas(tx);
      this.logger.log(`Estimated token transfer gas limit: ${gasLimit}`);
    }

    return gasLimit;
  }

  async computeOptimalGas(
    network: NetworkType,
    from: string,
    to: string,
    amount: string,
    tokenAddress?: string,
    userSpecifiedGas?: number,
  ): Promise<{ gasLimit: bigint; gasPrice: bigint }> {
    this.logger.log(`Computing optimal gas parameters for network: ${network}`);

    const [estimatedGasLimit, currentGasPrice] = await Promise.all([
      this.estimateGasLimit(network, from, to, amount, tokenAddress),
      this.estimateGasPrice(network),
    ]);

    const gasLimit = userSpecifiedGas
      ? BigInt(userSpecifiedGas)
      : (estimatedGasLimit * 120n) / 100n;

    this.logger.log(
      `Computed optimal gas - limit: ${gasLimit} (${userSpecifiedGas ? 'user specified' : 'estimated + 20% buffer'}), price: ${currentGasPrice}`,
    );

    return {
      gasLimit,
      gasPrice: currentGasPrice,
    };
  }
}
