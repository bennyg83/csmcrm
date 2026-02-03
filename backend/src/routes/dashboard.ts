import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { auth } from "../middleware/auth";

const router = Router();

// Dashboard metrics route - requires authentication
router.get("/metrics", auth, getDashboardMetrics);

export default router;
