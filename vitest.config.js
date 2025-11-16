import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 20000,
    },
    deps: { inline: [/\.ts$/] },
    transformMode: {
        web: [/\.ts$/],
    },
});
