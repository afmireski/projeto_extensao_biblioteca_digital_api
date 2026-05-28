import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Global Pino logger instance configured for structured JSON logging.
 * Pretty prints logs in development environments and uses raw JSON logs in production.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});
