import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
    },
    deps: { inline: [/\.ts$/] },
    transformMode: {
        web: [/\.ts$/],
    }
})
