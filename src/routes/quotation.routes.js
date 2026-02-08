import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as quotationController from "../controllers/quotation.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create quotation
router.post("/", quotationController.createQuotation);

// Get quotations by lead
router.get("/lead/:leadId", quotationController.getQuotationsByLead);

// Get quotation by ID
router.get("/:id", quotationController.getQuotationById);

// Send quotation email
router.post("/:id/send", quotationController.sendQuotationEmail);

// Update quotation status
router.patch("/:id/status", quotationController.updateQuotationStatus);

export default router;
