import { PrismaClient } from "@prisma/client";
// import dotenv from "dotenv";

// ✅ Construct DATABASE_URL dynamically using environment variables
// const DATABASE_URL = `mysql://${process.env.DB_USER}:${encodeURIComponent(
//   process.env.DB_PASSWORD!
// )}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // Enable query logging
  // datasources: {
  //   db: {
  //     url: DATABASE_URL,
  //   },
  // },
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ MySQL Database Connected Successfully!");
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    process.exit(1); // Exit if DB connection fails
  }
}

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("🔌 Disconnecting Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🔌 Disconnecting Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma, connectDB };
