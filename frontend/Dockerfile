FROM node:22-alpine3.20
WORKDIR /app
ENV NODE_ENV=production
COPY ./ ./
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
