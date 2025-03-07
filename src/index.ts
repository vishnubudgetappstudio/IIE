import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database"; // Import DB connection
import Routes from "./routes";
import errorHandler from "./utils/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use("/api", Routes);

// Global error handling middleware (should be last)
app.use(errorHandler);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

// Connect to Database before starting server
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
