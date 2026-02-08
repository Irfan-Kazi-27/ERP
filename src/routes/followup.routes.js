import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as followupController from "../controllers/followup.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create follow-up
router.post("/createfollowup", followupController.createFollowup);

// Get upcoming follow-ups
router.get("/upcoming", followupController.getUpcomingFollowups);

// Get follow-ups by lead
router.get("/lead/:leadId", followupController.getFollowupsByLead);

// Update follow-up
router.patch("/updatefollowup/:id", followupController.updateFollowup);

export default router;
