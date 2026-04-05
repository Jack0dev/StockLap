# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Accept build-time API URLs (set during docker build)
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install
# Copy the rest of the application code
COPY . .
# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80
EXPOSE 80
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
