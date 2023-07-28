module.exports = {
    apps : [{
      name: "wechat-midjourney",
      script: "npm",
      args: "run serve",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '2G',
    }]
  }
  