import {FlatCompat} from '@eslint/eslintrc'

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['prettier', 'next/core-web-vitals', 'next/typescript'],
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
    }
  }),
]

export default eslintConfig