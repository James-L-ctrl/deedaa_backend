FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

# Production stage - security: run as non-root user
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=production-dependencies-env --chown=nodejs:nodejs /app/node_modules /app/node_modules
COPY --from=build-env --chown=nodejs:nodejs /app/dist /app/dist
COPY --from=build-env --chown=nodejs:nodejs /app/prisma /app/prisma
COPY --from=build-env --chown=nodejs:nodejs /app/generated /app/generated

# Switch to non-root user
USER nodejs

CMD ["npm", "run", "start:prod"]