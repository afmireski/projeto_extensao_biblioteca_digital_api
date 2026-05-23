import { app } from './app';
import { logger } from './shared/logger';
import { container } from './container';
import type { IQueueService } from './infra/queue/queue.interface';
import type { OcrConsumer } from './modules/ocr/ocr.consumer';

const port = process.env.PORT || 3000;

const queueService = container.resolve('queueService') as IQueueService;
const ocrConsumer = container.resolve('ocrConsumer') as OcrConsumer;

queueService
  .connect()
  .then(() => {
    logger.info('Connected to Queue Service');
    return ocrConsumer.start();
  })
  .then(() => {
    logger.info('OCR Consumer started');
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'Failed to bootstrap the application');
    process.exit(1);
  });
