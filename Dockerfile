# Use Node.js 18 LTS as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
# Force Sharp to rebuild for the current platform (Linux x64)
RUN npm ci --omit=dev && npm rebuild sharp

# Copy the rest of the application code
COPY . .

# Create necessary directories for the application
RUN mkdir -p /app/share \
    && mkdir -p /app/SwensonShare \
    && mkdir -p /app/user

# Set proper permissions for directories
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the port the app runs on
EXPOSE 3752

# Define the command to run the application
CMD ["node", "index.js"]