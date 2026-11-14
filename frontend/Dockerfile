# 1. Use lightweight Node.js 20 on Alpine Linux
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first so Docker can cache installed libraries
COPY package*.json ./

# 4. Install npm dependencies
RUN npm install

# 5. Copy all frontend source files
COPY . .

# 6. Expose Vite development port
EXPOSE 5173

# 7. Start the Vite development server accessible from your browser
CMD ["npm", "run", "dev", "--", "--host"]
