import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/server/repositories/dashboard.mock.repository.ts',
        'src/server/services/dashboard.service.ts',
        'src/server/repositories/application.mock.repository.ts',
        'src/server/services/application.service.ts',
        'src/server/repositories/product.mock.repository.ts',
        'src/server/services/product.service.ts',
        'src/server/di/registry.ts',
        'src/app/page.tsx',
        'src/app/queue/page.tsx',
        'src/app/queue/UnderwritingWorkbench.tsx',
        'src/app/products/page.tsx',
        'src/app/products/ProductManagementWorkbench.tsx',
        'src/server/repositories/knowledge.mock.repository.ts',
        'src/server/services/knowledge.service.ts',
        'src/app/knowledge/page.tsx',
        'src/app/knowledge/KnowledgeBaseWorkbench.tsx',
        'src/server/repositories/health.mock.repository.ts',
        'src/server/services/health-audit.service.ts',
        'src/app/health/page.tsx',
        'src/app/health/SystemHealthWorkbench.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
