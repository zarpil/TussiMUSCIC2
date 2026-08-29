#!/bin/sh

echo "🚀 Starting Tussi Music System..."

# Start API server
echo "Starting API..."
node server/index.js &

# Start Discord bot
echo "Starting Bot..."
node index.js &

# Wait for all processes
wait
