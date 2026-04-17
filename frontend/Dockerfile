FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 5173

# Start the server
CMD ["npm", "run", "preview"]