import { Injectable, Logger } from '@nestjs/common';
import { NetworkType, SharedConfig } from '@core/shared';

@Injectable()
export class TvmGasComputingService {
  private readonly logger = new Logger(TvmGasComputingService.name);

  constructor(private readonly sharedConfig: SharedConfig) {}

  async estimateGasPrice(network: NetworkType): Promise<number> {
    try {
      // In Tron, bandwidth points and energy are used instead of gas
      // Default values can be fetched from the network or config
      const networkConfig = this.sharedConfig.networks[network];
      // return networkConfig.defaultFeeLimit || 1000000; // Default fee limit for Tron transactions
      return 1000000;
    } catch (error) {
      this.logger.error(`Failed to estimate gas price: ${error.message}`);
      throw error;
    }
  }

  async calculateGasLimit(
    network: NetworkType,
    isToken: boolean = false,
  ): Promise<number> {
    try {
      // For Tron, we need to estimate energy consumption
      // Token transfers typically consume more energy than TRX transfers
      const baseLimit = isToken ? 200000 : 100000;
      return baseLimit;
    } catch (error) {
      this.logger.error(`Failed to calculate gas limit: ${error.message}`);
      throw error;
    }
  }
}
