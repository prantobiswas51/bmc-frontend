// pm2 process definition. Runs from the folder this file lives in, so the
// deployed .env.local (API_URL) is picked up.
module.exports = {
  apps: [
    {
      name: 'bmc-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      env: { NODE_ENV: 'production' },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
