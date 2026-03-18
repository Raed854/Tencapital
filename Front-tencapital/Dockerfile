# Multi-stage build for React application on Railway
# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build arguments for environment variables (passed from Railway)
ARG REACT_APP_API_URL
ARG REACT_APP_API_TIMEOUT=10000
ARG REACT_APP_ENABLE_DEBUG=false
ARG REACT_APP_FALLBACK_URLS
ARG NODE_ENV=production

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_API_TIMEOUT=$REACT_APP_API_TIMEOUT
ENV REACT_APP_ENABLE_DEBUG=$REACT_APP_ENABLE_DEBUG
ENV REACT_APP_FALLBACK_URLS=$REACT_APP_FALLBACK_URLS
ENV NODE_ENV=$NODE_ENV

# Make build script executable and run it
RUN chmod +x railway-build.sh 2>/dev/null || true
RUN echo "Building with REACT_APP_API_URL=${REACT_APP_API_URL}"
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Railway uses PORT environment variable
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
