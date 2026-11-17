FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci --workspace=shared --workspace=backend

COPY shared/ shared/
COPY backend/ backend/

RUN npm run build --workspace=shared
RUN npm run build --workspace=backend

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci --workspace=shared --workspace=backend --omit=dev

COPY --from=builder /app/shared/dist shared/dist
COPY shared/package.json shared/
COPY --from=builder /app/backend/dist backend/dist
COPY backend/package.json backend/

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
