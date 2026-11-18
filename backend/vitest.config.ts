import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-minimum-32-characters-long!!',
      JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-chars!!a',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      SMS_ENABLED: 'false',
    },
  },
  resolve: {
    alias: {
      '@bccs/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
