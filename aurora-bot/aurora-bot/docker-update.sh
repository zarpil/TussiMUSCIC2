#!/bin/bash

# Aurora Music Bot - Docker Update Script

echo "🔄 Aurora Music Bot - Update Script"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Pulling latest changes...${NC}"
git pull

echo -e "${BLUE}Step 2: Stopping containers...${NC}"
docker-compose down

echo -e "${BLUE}Step 3: Rebuilding containers...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}Step 4: Starting containers...${NC}"
docker-compose up -d

echo -e "${BLUE}Step 5: Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Update complete!${NC}"
echo ""
docker-compose ps
echo ""
echo "View logs: docker-compose logs -f"
