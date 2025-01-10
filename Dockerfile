FROM node:20

WORKDIR /app

COPY . /app

RUN npm install -g pnpm

RUN pnpm i

RUN pnpm build:app

RUN pnpm build:server