import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        // Carrega as variáveis do .env (necessárias nos testes de integração).
        env: loadEnv("test", process.cwd(), ""),
        testTimeout: 20000,
        hookTimeout: 30000,
        // Testes de integração usam o banco real: execução sequencial evita interferência.
        fileParallelism: false,
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            // Excluídos apenas o ponto de entrada que sobe o servidor.
            exclude: ["src/server.ts"],
            reporter: ["text", "html", "json-summary"],
            reportsDirectory: "coverage",
            thresholds: {
                lines: 60,
                statements: 60,
                functions: 60,
                branches: 60,
            },
        },
    },
});
