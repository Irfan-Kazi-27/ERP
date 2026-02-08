import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as orderController from "../controllers/order.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Convert quotation to order
router.post("/convert/:quotationId", orderController.convertQuotationToOrder);

// Get all orders
router.get("/", orderController.getAllOrders);

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Update order status
router.patch("/:id/status", orderController.updateOrderStatus);

// Add PO to order
router.patch("/:id/po", orderController.addPOToOrder);

export default router;
