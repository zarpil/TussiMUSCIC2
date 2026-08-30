FROM node:20-slim

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fontconfig \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy all files
COPY . .

# Create logs folder
RUN mkdir -p logs

# Expose ports
EXPOSE 3001

# Start everything
CMD ["sh", "start.sh"]