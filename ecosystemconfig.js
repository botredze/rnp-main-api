module.exports = {
  apps: [
    {
      name: 'main',
      script: 'npm',
      args: 'run start:main:prod',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'scheduler',
      script: 'npm',
      args: 'run start:scheduler',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'executor',
      script: 'npm',
      args: 'run start:executor',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
