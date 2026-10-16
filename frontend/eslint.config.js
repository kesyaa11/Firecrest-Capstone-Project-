import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Global ignores
  globalIgnores([".config/*", "dist/*", "public/*", "build/*"]),

  // Javascript Config
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: globals.browser } 
  },

  pluginReact.configs.flat.recommended,

  // Remove the error 'React' must be in scope when using JSX
  pluginReact.configs.flat["jsx-runtime"],

  {
    settings: {
      react: {
        version: "19"
      }
    },
    rules: {
      "react/prop-types": "off"
    }
  }
]);
