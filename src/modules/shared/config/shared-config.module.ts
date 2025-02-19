import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedConfig } from './shared.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  providers: [SharedConfig],
  exports: [SharedConfig],
})
export class SharedConfigModule {}
