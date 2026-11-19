import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://root:YOUR_LOCAL_MYSQL_PASSWORD@127.0.0.1:3306/ca_proflow_test',
    },
  },
});
