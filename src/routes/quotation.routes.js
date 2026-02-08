import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as quotationController from "../controllers/quotation.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create quotation
router.post("/createquotation", quotationController.createQuotation);

// Get all quotations
router.get("/get-all-quotations", quotationController.getAllQuotations);

// Get quotations by lead
router.get("/getquotationsbylead/:leadId", quotationController.getQuotationsByLead);

// Get quotation by ID
router.get("/getquotationbyid/:id", quotationController.getQuotationById);

// Send quotation email
router.post("/sendquotationemail/:id", quotationController.sendQuotationEmail);

// Update quotation status
router.patch("/updatequotationstatus/:id", quotationController.updateQuotationStatus);

// Update quotation details
router.put("/updatequotation/:id", quotationController.updateQuotation);

export default router;
