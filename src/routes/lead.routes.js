import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as leadController from "../controllers/lead.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create new lead
router.post("/createlead", leadController.createLead);

// Get all leads with filters
router.get("/get-all-leads", leadController.getAllLeads);

// Get lead by ID
router.get("/get-lead-by-id/:id", leadController.getLeadById);

// Review lead (Approve/Reject) - Team Lead only
router.patch("/review/:id", leadController.reviewLead);

// Assign sales person - Team Lead only
router.patch("/assign/:id", leadController.assignSalesPerson);

// Update lead details
router.patch("/updatelead/:id", leadController.updateLead);

// Delete lead
router.delete("/deletelead/:id", leadController.deleteLead);

// Get lead stats
router.get("/stats", leadController.getLeadStats);

// Update lead status
router.patch("/update-status/:id", leadController.updateLeadStatus);

export default router;
