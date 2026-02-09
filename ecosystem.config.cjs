module.exports = {
  apps: [
    {
      name: 'listen-items-changes',
      cwd: '/root/joplin-adonis',
      script: 'node',
      args: 'build/bin/console.js listen:items-changes',
      autorestart: true,
    },
  ],
}
