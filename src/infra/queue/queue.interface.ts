export interface IQueueService {
  connect(): Promise<void>;
  publish(
    exchange: string,
    routingKey: string,
    content: unknown,
  ): Promise<void>;
  consume(
    queue: string,
    onMessage: (
      content: unknown,
      ack: () => void,
      nack: (requeue?: boolean) => void,
    ) => Promise<void>,
  ): Promise<void>;
  close(): Promise<void>;
}
