import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        tenant: {
          primary: "var(--tenant-primary)",
          secondary: "var(--tenant-secondary)",
          bg: "var(--tenant-bg)",
        },
      },
    },
  },
} satisfies Config;

export default config;
