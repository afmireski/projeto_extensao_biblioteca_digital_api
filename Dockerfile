FROM oven/bun:1.3 AS base
WORKDIR /app

# Copy dependency definitions and lockfile
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code, config files, and docs
COPY tsconfig.json kysely.config.ts ./
COPY src ./src
COPY docs ./docs

# Expose the API port
EXPOSE 3000

# Default command
CMD ["bun", "run", "src/server.ts"]
