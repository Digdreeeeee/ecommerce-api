const env = require('./config/env');
const app = require('./app');
const prisma = require('./lib/prisma');

const server = app.listen(env.port, (err) => {
  if (err) {
    console.error('Không thể khởi động server:', err.message);
    process.exit(1);
  }
  console.log(`API chạy tại http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown() {
  console.log('Đang tắt server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
