FROM node:22

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y poppler-data && apt-get install -y poppler-utils

RUN npm install -g pnpm

RUN pnpm i

RUN pnpx prisma generate

RUN pnpm build:app

RUN pnpm build:server