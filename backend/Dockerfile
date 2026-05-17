FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY . .

# ✅ node:alpine ya tiene el usuario 'node' creado
RUN chown -R node:node /app
USER node

EXPOSE 3001
CMD ["node", "server.js"]