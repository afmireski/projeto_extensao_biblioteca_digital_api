FROM oven/bun:1.3 AS base
WORKDIR /app

# Copy dependency definitions and lockfile
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and config files
COPY tsconfig.json kysely.config.ts ./
COPY src ./src

# Expose the API port
EXPOSE 3000

# Default command
CMD ["bun", "run", "src/server.ts"]
