module.exports = {
  apps: [
    {
      name: 'listen-items-changes',
      script: 'node',
      args: 'ace listen:items-changes',
      autorestart: true,
    },
  ],
}
