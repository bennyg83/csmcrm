import { Router } from "express";
import { getDashboardMetrics, getCSMWorkload } from "../controllers/dashboardController";
import { auth } from "../middleware/auth";

const router = Router();

router.get("/metrics", auth, getDashboardMetrics);
router.get("/csm-workload", auth, getCSMWorkload);

export default router;
