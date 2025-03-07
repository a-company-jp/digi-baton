FROM shion1305/pnpm:22-alpine3.20 AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --ignore-scripts --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
