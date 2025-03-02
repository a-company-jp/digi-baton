import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  {
    ignores: [
      "**/node_modules/",
      "**/.next/",
      "**/*.log",
      "**/*.csv",
      "**/*.dat",
      "**/*.out",
      "**/*.pid",
      "**/*.seed",
      "**/*.gz",
      "**/.idea/",
      "**/*.swp",
      "**/*.swo",
      "**/*.swn",
      "**/.vscode/",
      "**/.DS_Store",
      "**/.DS_Store?",
      "**/._*",
      "**/.Spotlight-V100",
      "**/.Trashes",
      "**/ehthumbs.db",
      "**/Thumbs.db",
      "src/gql/__generated__/",
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      "next",
      "eslint:recommended",
      "prettier",
      "next/core-web-vitals",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:prettier/recommended",
      "plugin:react-hooks/recommended"
    )
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      "quote-props": ["error", "as-needed"],
      "react/jsx-fragments": ["error", "syntax"],

      "react/jsx-filename-extension": [
        "error",
        {
          extensions: [".ts", ".tsx"],
        },
      ],

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
