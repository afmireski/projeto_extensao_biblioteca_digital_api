import amqp from 'amqplib';
import type { IQueueService } from './queue.interface';
import { logger } from '../../shared/logger';
import { InternalError } from '../../shared/errors/app-errors';

export class RabbitMQService implements IQueueService {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  connect(): Promise<void> {
    if (this.connection) {
      return Promise.resolve();
    }
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const delayMs = Number(process.env.OCR_JOB_RETRY_DELAY_MS || '300000');
    logger.info({ url, delayMs }, 'Connecting to RabbitMQ');

    return amqp
      .connect(url)
      .then((conn) => {
        this.connection = conn;
        return conn.createChannel();
      })
      .then((ch) => {
        this.channel = ch;
        return ch.prefetch(1).then(() => ch);
      })
      .then((ch) => {
        return Promise.all([
          ch.assertExchange('ocr.exchange', 'direct', { durable: true }),
          ch.assertExchange('ocr.delay.exchange', 'direct', { durable: true }),
        ]).then(() => ch);
      })
      .then((ch) => {
        return Promise.all([
          ch.assertQueue('ocr.process.queue', { durable: true }),
          ch.assertQueue('ocr.delay.queue', {
            durable: true,
            arguments: {
              'x-message-ttl': delayMs,
              'x-dead-letter-exchange': 'ocr.exchange',
              'x-dead-letter-routing-key': 'ocr.process.key',
            },
          }),
        ]).then(() => ch);
      })
      .then((ch) => {
        return Promise.all([
          ch.bindQueue('ocr.process.queue', 'ocr.exchange', 'ocr.process.key'),
          ch.bindQueue(
            'ocr.delay.queue',
            'ocr.delay.exchange',
            'ocr.delay.key',
          ),
        ]).then(() => {});
      })
      .catch((err) => {
        logger.error({ err }, 'RabbitMQ connection/setup failed');
        throw new InternalError({ cause: err });
      });
  }

  publish(
    exchange: string,
    routingKey: string,
    content: unknown,
  ): Promise<void> {
    if (!this.channel) {
      return Promise.reject(
        new InternalError({
          cause: new Error('RabbitMQ channel not initialized'),
        }),
      );
    }

    try {
      const buffer = Buffer.from(JSON.stringify(content));
      const success = this.channel.publish(exchange, routingKey, buffer, {
        persistent: true,
      });
      if (!success) {
        logger.warn(
          { exchange, routingKey },
          'RabbitMQ publish returned false (buffer full)',
        );
      }
      return Promise.resolve();
    } catch (err) {
      logger.error(
        { err, exchange, routingKey },
        'Failed to publish to RabbitMQ',
      );
      return Promise.reject(new InternalError({ cause: err }));
    }
  }

  consume(
    queue: string,
    onMessage: (
      content: unknown,
      ack: () => void,
      nack: (requeue?: boolean) => void,
    ) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) {
      return Promise.reject(
        new InternalError({
          cause: new Error('RabbitMQ channel not initialized'),
        }),
      );
    }

    return this.channel
      .consume(
        queue,
        (msg) => {
          if (!msg) {
            logger.warn('RabbitMQ consumer cancelled by broker');
            return;
          }

          let content;
          try {
            content = JSON.parse(msg.content.toString());
          } catch (err) {
            logger.error(
              { err, rawContent: msg.content.toString() },
              'Failed to parse RabbitMQ message content',
            );
            this.channel?.ack(msg);
            return;
          }

          const ack = () => {
            this.channel?.ack(msg);
          };

          const nack = (requeue = true) => {
            this.channel?.nack(msg, false, requeue);
          };

          onMessage(content, ack, nack).catch((err) => {
            logger.error({ err }, 'Error in consumer message callback');
            this.channel?.nack(msg, false, true);
          });
        },
        { noAck: false },
      )
      .then(() => {});
  }

  close(): Promise<void> {
    if (!this.connection) {
      return Promise.resolve();
    }

    const closeChannelPromise = this.channel
      ? this.channel.close().catch((err) => {
          logger.warn(
            { err },
            'Error closing RabbitMQ channel during teardown',
          );
        })
      : Promise.resolve();

    return closeChannelPromise
      .then(() => {
        return this.connection
          ? this.connection.close().catch((err) => {
              logger.warn(
                { err },
                'Error closing RabbitMQ connection during teardown',
              );
            })
          : Promise.resolve();
      })
      .then(() => {
        this.channel = null;
        this.connection = null;
      });
  }
}
