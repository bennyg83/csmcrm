import "reflect-metadata";
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { config } from "dotenv";
import { AppDataSource } from "./config/data-source";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3002;
const isProduction = process.env.NODE_ENV === "production";

// Middleware
app.use(helmet());
app.use(compression());

// CORS: GitHub Pages (this repo) + env override (comma-separated). Keep segregated from other projects.
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5177",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://bennyg83.github.io",
  "https://bennyg83.github.io/csmcrm"
];
const corsOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);
if (isProduction) {
  corsOrigins.push(`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    const allowed = corsOrigins.some((a) => normalized.startsWith(a.replace(/\/$/, "")));
    if (allowed) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"]
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test endpoint to verify seeded data (development only; disable in production)
if (process.env.NODE_ENV !== "production") {
  app.get("/api/test/data", async (_req, res) => {
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
}

// Import routes
import authRoutes from "./routes/auth";
import googleAuthRoutes from "./routes/googleAuth";
import gmailRoutes from "./routes/gmail";
import accountRoutes from "./routes/accounts";
import contactRoutes from "./routes/contacts";
import taskRoutes from "./routes/tasks";
import noteRoutes from "./routes/notes";
import healthScoreRoutes from "./routes/healthScores";
import accountActivityRoutes from "./routes/accountActivities";
import accountTierRoutes from "./routes/accountTiers";
import categoryRoutes from "./routes/categories";
import documentRoutes from "./routes/documents";
import calendarRoutes from "./routes/calendar";
import leadRoutes from "./routes/leads";
import workflowRoutes from "./routes/workflows";
import reportRoutes from "./routes/reports";
import rbacRoutes from "./routes/rbac";
import portalRoutes from "./routes/portal";
import externalRoutes from "./routes/external";
import dashboardRoutes from "./routes/dashboard";
import projectRoutes from "./routes/projects";
import milestoneRoutes from "./routes/milestones";
import projectContactRoutes from "./routes/projectContacts";
import entityFileRoutes from "./routes/entityFiles";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/accounts", accountRoutes);
// Keep existing path structure: contacts nested under accounts
app.use("/api/accounts", contactRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/health-scores", healthScoreRoutes);
app.use("/api/account-activities", accountActivityRoutes);
app.use("/api/account-tiers", accountTierRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/rbac", rbacRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/external", externalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/project-contacts", projectContactRoutes);
app.use("/api/entity-files", entityFileRoutes);

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "test") {
    console.error("Unhandled error:", err);
  }
  res.status(status).json({ error: message });
});

// Production: serve built frontend from backend (single-process / executable bundle)
if (isProduction) {
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  // 404 handler (development)
  app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
}

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