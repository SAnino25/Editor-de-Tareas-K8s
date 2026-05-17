FROM node:20-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# ✅ node:alpine ya tiene el usuario 'node' creado
RUN chown -R node:node /app
USER node

EXPOSE 5173
CMD ["npm", "run", "dev"]