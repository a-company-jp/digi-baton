# copy binary from github actions
FROM alpine:3.20
COPY ./main /app/main
COPY ./db/migrations /app/db/migrations
RUN chmod +x /app/main && apk add libc6-compat
WORKDIR /app
CMD ["/app/main"]
