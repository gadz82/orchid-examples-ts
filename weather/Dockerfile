# Dockerfile — Weather TypeScript example
#
# Usage:
#   docker build -t orchid-ts-weather .
#   docker run --rm orchid-ts-weather
#
# Used by docker-compose.yml in this directory.

FROM node:22-slim

WORKDIR /app

# Install orchid framework from GitHub (npm packages not yet published)
# Convention: gadz82/orchid-ts → @orchid-ai/orchid on npm in the future
RUN npm install typescript tsx \
    github:gadz82/orchid-ts

COPY . .

ENV NODE_ENV=production
ENV ORCHID_CONFIG=/app/orchid.yml

CMD ["npx", "tsx", "main.ts"]
