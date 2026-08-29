FROM node:20-alpine

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
