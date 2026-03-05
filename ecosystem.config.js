module.exports = {
  apps: [
    {
      name: "Ebook Tools",
      script: "PORT=8386 npm run start",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "450M",
    },
  ],
};
