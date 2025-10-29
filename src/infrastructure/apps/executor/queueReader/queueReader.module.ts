import { Module } from '@nestjs/common';
import { QueueReaderService } from './queueReader.service';
import { QueueReaderController } from './queueReader.controller';

@Module({
  imports: [],
  controllers: [QueueReaderController],
  providers: [QueueReaderService],
  exports: [QueueReaderService],
})
export class QueueReaderModule {}
