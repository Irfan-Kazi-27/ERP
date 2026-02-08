import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as dashboardController from "../controllers/dashboard.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Get lead statistics
router.get("/leads", dashboardController.getLeadStatistics);

// Get sales metrics
router.get("/sales", dashboardController.getSalesMetrics);

// Get order dashboard
router.get("/orders", dashboardController.getOrderDashboard);

// Get follow-up reminders
router.get("/reminders", dashboardController.getFollowupReminders);

export default router;
