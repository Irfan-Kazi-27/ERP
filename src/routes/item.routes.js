import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as itemController from "../controllers/item.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Create item
router.post("/", itemController.createItem);

// Get all items
router.get("/", itemController.getAllItems);

// Get item by ID
router.get("/:id", itemController.getItemById);

// Update item
router.patch("/:id", itemController.updateItem);

// Delete item
router.delete("/:id", itemController.deleteItem);

export default router;
