import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as leadController from "../controllers/lead.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create new lead
router.post("/", leadController.createLead);

// Get all leads with filters
router.get("/", leadController.getAllLeads);

// Get lead by ID
router.get("/:id", leadController.getLeadById);

// Review lead (Approve/Reject) - Team Lead only
router.patch("/:id/review", leadController.reviewLead);

// Assign sales person - Team Lead only
router.patch("/:id/assign", leadController.assignSalesPerson);

// Update lead status
router.patch("/:id/status", leadController.updateLeadStatus);

export default router;
