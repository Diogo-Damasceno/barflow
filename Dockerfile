FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++ build-base
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache python3 make g++ build-base
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/dist ./dist
COPY prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
