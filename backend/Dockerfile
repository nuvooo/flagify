# Stage 2: Runtime
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL 1.1 - required for Prisma
RUN apt-get update && \
    apt-get install -y openssl libssl1.1 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY . .

# Build
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
