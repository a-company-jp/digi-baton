import { defineConfig } from "orval";

export default defineConfig({
  backend: {
    output: {
      mode: "tags-split",
      target: "app/api/generated",
      schemas: "app/api/generated/schemas",
      clean: true,
      client: "react-query",
      httpClient: "fetch",
      override: {
        mutator: {
          path: "./lib/fetch.ts",
        },
      },
    },
    input: {
      target: "../backend/docs/swagger.orval.json",
    },
  },
});
