# Use official Node.js LTS image as the base
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables (optional, can be overridden)
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
