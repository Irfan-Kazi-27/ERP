import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import * as orderController from "../controllers/order.controllers.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Convert quotation to order
router.post("/convert/:quotationId", orderController.convertQuotationToOrder);

// Get all orders
router.get("/getallorders", orderController.getAllOrders);

// Get order by ID
router.get("/getorderbyid/:id", orderController.getOrderById);

// Update order status
router.patch("/update-status/:id", orderController.updateOrderStatus);

// Add PO to order
router.patch("/add-po/:id", orderController.addPOToOrder);

export default router;
