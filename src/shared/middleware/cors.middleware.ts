import cors from 'cors';

/**
 * Factory function to create the Express CORS (Cross-Origin Resource Sharing) middleware.
 *
 * This middleware configures CORS headers dynamically based on environment settings:
 * - Reads allowed origins from `process.env.CORS_ORIGIN` (which can be a comma-separated list or `*`).
 * - Defaults to `http://localhost:3000` (typical NextJS frontend port) if no `CORS_ORIGIN` is provided.
 * - Dynamically allows any localhost port (e.g., `http://localhost:3000`, `http://localhost:8000`)
 *   when running in development mode (`process.env.NODE_ENV === 'development'`).
 * - Supports sending requests with credentials (cookies, client-side TLS certificates, or authorization headers)
 *   by enabling `credentials: true` and returning the matching request origin header.
 *
 * @returns Express RequestHandler configured with CORS policies.
 */
export const corsMiddleware = () => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV === 'development' &&
          /^http:\/\/localhost:\d+$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });
};
