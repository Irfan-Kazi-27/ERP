import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as partyController from "../controllers/party.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create new party
router.post("/createparty", partyController.createParty);

// Get all parties / Search
router.get("/getallparties", partyController.getAllParties);

// Get party by ID
router.get("/getpartybyid/:id", partyController.getPartyById);

// Update party
router.patch("/updateparty/:id", partyController.updateParty);

// Delete party
router.delete("/deleteparty/:id", partyController.deleteParty);

export default router;
