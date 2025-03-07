FROM node:22-alpine3.20
WORKDIR /app
ENV NODE_ENV=production
COPY ./.next ./.next
COPY ./public ./public
COPY ./node_modules ./node_modules
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
