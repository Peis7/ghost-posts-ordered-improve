# Stage 1: Build the NestJS app
FROM node:18.20.4-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Clean build directories before building the app
RUN npm run clean || echo "No clean script defined"

# Install dependencies
RUN npm install 

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Copy the rest of the application code to the container
COPY . .

# Check Node and npm versions
RUN node -v && npm -v

# Build the application
RUN npm run build && ls -R /app


# Stage 2: Production image
FROM node:18-alpine AS runner

# Set the working directory inside the container
WORKDIR /app

# Copy the production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy the compiled application code from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the .env file to the container
COPY .env.production .env.production

# Expose the port the app runs on
EXPOSE 3003

# Command to start the application
CMD ["node", "dist/main"]
