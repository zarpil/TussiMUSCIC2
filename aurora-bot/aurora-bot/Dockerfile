FROM node:22-bookworm

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
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