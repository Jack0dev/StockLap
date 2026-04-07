# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Get API URLs from build args (Railway injects them automatically during build workload)
ARG VITE_API_URL=http://localhost:8080/api
ARG VITE_WS_URL=http://localhost:8080/ws
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Build the application (Vite reads ENV vars as import.meta.env.*)
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine
# Copy nginx config as template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
# Copy the built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html
# Default port if PORT not set
ENV PORT=80
EXPOSE 80
# Replace only $PORT in template, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
