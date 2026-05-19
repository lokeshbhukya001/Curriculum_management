# Frontend Dockerfile
# Components: React, Vite, TailwindCSS
# Versions:
#   - Node: 20-slim
#   - React: 18.2.0
#   - Vite: 5.4.8

FROM node:20-slim

WORKDIR /app

# Copy package files from the 'frontend' subdirectory
COPY frontend/package*.json ./

RUN npm install

# Copy the rest of the frontend code
COPY frontend/ ./

# Expose Vite dev port
EXPOSE 5173

# Run Vite with --host to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
