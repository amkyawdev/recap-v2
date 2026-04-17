FROM node:20-alpine

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server.js"]