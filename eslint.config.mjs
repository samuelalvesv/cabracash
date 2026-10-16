import nextConfig from "eslint-config-next/core-web-vitals";
import nextTsConfig from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextConfig,
  ...nextTsConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".agents/**",
    ],
  },
];

export default eslintConfig;
