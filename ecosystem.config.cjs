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
      },
    },
  ],
};
