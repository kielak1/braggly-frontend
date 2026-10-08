import nextVitals from "eslint-config-next/core-web-vitals";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    // Report existing effect patterns without expanding this migration into
    // a state-management refactor. The React Compiler is not enabled.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
];

export default eslintConfig;
