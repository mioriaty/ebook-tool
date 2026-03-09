module.exports = {
  apps: [
    {
      name: "Ebook Tools",
      script: "node_modules/.bin/next",
      args: "start -p 8386",
      cwd: "/home/production/ebook-tool",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "450M",
    },
  ],
};
