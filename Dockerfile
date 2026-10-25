FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install root dependencies
COPY package*.json ./
RUN npm install --production=false

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy entire source code
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Expose port (default 5000 or from env)
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start unified server
CMD ["node", "server/index.js"]
