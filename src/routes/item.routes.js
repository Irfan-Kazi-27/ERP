import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as itemController from "../controllers/item.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create item
router.post("/createitem", itemController.createItem);

// Get all items
router.get("/getallitems", itemController.getAllItems);

// Get item by ID
router.get("/getitembyid/:id", itemController.getItemById);

// Update item
router.patch("/updateitem/:id", itemController.updateItem);

// Delete item
router.delete("/deleteitem/:id", itemController.deleteItem);

export default router;
