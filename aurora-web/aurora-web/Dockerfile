FROM node:22-alpine

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the Next.js app
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]
