import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";
import { AppDataSource } from "./config/data-source";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://yourdomain.com"] 
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5177", "http://localhost:3000"],
  credentials: true
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test endpoint to verify seeded data (no authentication required)
app.get("/api/test/data", async (req, res) => {
  try {
    const accountRepository = AppDataSource.getRepository("Account");
    const contactRepository = AppDataSource.getRepository("Contact");
    const taskRepository = AppDataSource.getRepository("Task");
    
    const accounts = await accountRepository.find();
    const contacts = await contactRepository.find();
    const tasks = await taskRepository.find();
    
    res.json({
      message: "Database connection and data verification successful!",
      counts: {
        accounts: accounts.length,
        contacts: contacts.length,
        tasks: tasks.length
      },
      sampleData: {
        accounts: accounts.slice(0, 2).map(acc => ({
          id: acc.id,
          name: acc.name,
          status: acc.status,
          health: acc.health
        })),
        tasks: tasks.slice(0, 2).map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          progress: task.progress
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test data", message: error instanceof Error ? error.message : "Unknown error" });
  }
});

// Import routes
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/accounts";
import contactRoutes from "./routes/contacts";
import taskRoutes from "./routes/tasks";
import noteRoutes from "./routes/notes";
import healthScoreRoutes from "./routes/healthScores";
import accountActivityRoutes from "./routes/accountActivities";
import accountTierRoutes from "./routes/accountTiers";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/accounts", contactRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/health-scores", healthScoreRoutes);
app.use("/api/account-activities", accountActivityRoutes);
app.use("/api/account-tiers", accountTierRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

startServer(); 