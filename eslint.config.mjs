import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["index.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  },
  {
    languageOptions: {
      globals: globals.node
    }
  },
  pluginJs.configs.recommended
]
