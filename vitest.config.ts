import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/tests/globalSetup.ts"],

    // Trava para rodar um arquivo de teste por vez
    maxWorkers: 1,

    // Trava crucial: Garante que os testes de DENTRO do arquivo rodem um depois do outro
    sequence: {
      concurrent: false,
    },

    // Se o pool 'forks' bugar com as travas acima, use o pool 'threads' ou isole:
    pool: "forks",
  },
});
