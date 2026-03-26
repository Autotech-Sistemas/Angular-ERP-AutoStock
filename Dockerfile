FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/ /app/dist/
RUN npm install -g serve
EXPOSE 4200
CMD ["serve", "-s", "dist", "-l", "4200"]