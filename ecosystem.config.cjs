const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'web-admin',
      cwd: path.join(__dirname, 'apps/web-admin'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3000',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production',
        API_INTERNAL_URL: 'http://127.0.0.1:4000',
      },
    },
    {
      name: 'api-server',
      cwd: path.join(__dirname, 'apps/api-server'),
      script: 'dist/index.js',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
    {
      name: 'worker-engine',
      cwd: path.join(__dirname, 'apps/worker-engine'),
      script: 'dist/index.js',
      interpreter: '/usr/bin/node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
