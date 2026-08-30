FROM node:22-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and install all dependencies (including devDependencies needed for build)
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy all source files
COPY . .

# Build the Next.js app
RUN npm run build

# Set NODE_ENV to production for runtime
ENV NODE_ENV=production

# Expose Next.js port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]
