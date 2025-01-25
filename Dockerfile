# -----------------------
# 1. Builder Stage
# -----------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy only the lock files first for caching layers
COPY package*.json yarn.lock ./
RUN yarn install

# Copy the rest of the source code
COPY . .

# Build the NestJS project
RUN yarn build


# -----------------------
# 2. Production Stage
# -----------------------
FROM node:20-alpine AS production
WORKDIR /app

# Copy package files again and install only production dependencies
COPY package*.json yarn.lock ./
RUN yarn install --production

# Copy compiled files from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3030

CMD ["yarn", "start:prod"]
