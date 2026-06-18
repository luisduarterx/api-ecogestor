import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./src/tests/globalSetup.ts", // Caminho para o arquivo que criamos
    // suas outras configurações...
  },
});
