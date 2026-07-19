FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# We disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# Standalone builds run via server.js
CMD ["node", "server.js"]
