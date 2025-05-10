# Use Node.js 20 as the base image
FROM node:20-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install dependencies with exact versions
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run check

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Install dependencies with exact versions (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"] 