import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "dist/**", "next-env.d.ts", "integrations/office-background/**", "public/office/**", "apps/mf-stream/**"]
  }
];

export default eslintConfig;
