# Dockerfile — Postgres Storage TypeScript example
#
# API server image demonstrating @orchid-ai/orchid-storage-postgres.
# Installs the framework, the API server, the PostgreSQL storage plugin,
# and the PostgreSQL checkpointer from GitHub (npm publication placeholder),
# then serves orchid-api-ts.
#
# Usage:
#   docker build -t orchid-ts-postgres-storage .
#   docker run --rm -p 8080:8000 orchid-ts-postgres-storage
#
# Used by docker-compose.yml in this directory.

FROM node:22-slim

WORKDIR /app

# Install orchid framework, API server, PostgreSQL plugin, and PostgreSQL checkpointer
# from GitHub (npm packages not yet published).
# Convention: gadz82/orchid-ts -> @orchid-ai/orchid on npm in the future.
RUN npm install typescript tsx \
    github:gadz82/orchid-ts \
    github:gadz82/orchid-api-ts \
    github:gadz82/orchid-storage-postgres-ts \
    @langchain/langgraph-checkpoint-postgres

COPY . /app/config

ENV NODE_ENV=production
ENV ORCHID_CONFIG=/app/config/orchid.yml
ENV AGENTS_CONFIG_PATH=/app/config/agents.yaml

EXPOSE 8000

CMD ["npx", "tsx", "node_modules/@orchid-ai/orchid-api/src/cli.ts"]
