import { defineConfig } from "eslint/config";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const nextConfigEntries = Array.isArray(nextCoreWebVitals)
  ? nextCoreWebVitals
  : [nextCoreWebVitals];

export default defineConfig([
  ...nextConfigEntries,
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "public/runConfig*.js",
    ],
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
