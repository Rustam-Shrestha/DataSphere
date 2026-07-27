import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:admin@localhost:5432/compliance_db?schema=public",
  },
  schema: "prisma/schema.prisma",
});
