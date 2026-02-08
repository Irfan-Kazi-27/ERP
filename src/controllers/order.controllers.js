import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as orderService from "../services/order.services.js";

/**
 * Convert quotation to order
 * POST /api/orders/convert/:quotationId
 */
export const convertQuotationToOrder = asyncHandler(async (req, res) => {
    const { quotationId } = req.params;

    const order = await orderService.convertQuotationToOrder(quotationId, req.user._id);

    return res.status(201).json(
        new ApiResponse(201, order, "Quotation converted to order successfully")
    );
});

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await orderService.getOrderById(id);

    // Check access - STAFF can only view their own orders
    if (req.user.role === "STAFF" && order.salesPerson._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only view your own orders");
    }

    return res.status(200).json(
        new ApiResponse(200, order, "Order fetched successfully")
    );
});

/**
 * Get all orders with filters
 * GET /api/orders
 */
export const getAllOrders = asyncHandler(async (req, res) => {
    const { status, salesPerson, dateFrom, dateTo, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
        status,
        salesPerson,
        dateFrom,
        dateTo,
        search
    };

    const pagination = {
        page,
        limit,
        sortBy,
        sortOrder
    };

    const result = await orderService.getAllOrders(filters, pagination, req.user._id, req.user.role);

    return res.status(200).json(
        new ApiResponse(200, result, "Orders fetched successfully")
    );
});

/**
 * Update order status
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const order = await orderService.updateOrderStatus(id, status);

    return res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});

/**
 * Add PO to order
 * PATCH /api/orders/:id/po
 */
export const addPOToOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { poNumber, poDate, poFile, poAmount } = req.body;

    if (!poNumber || !poDate) {
        throw new ApiError(400, "PO number and date are required");
    }

    const poData = {
        poNumber,
        poDate,
        poFile,
        poAmount
    };

    const order = await orderService.addPOToOrder(id, poData, req.user._id);

    return res.status(200).json(
        new ApiResponse(200, order, "PO added to order successfully")
    );
});
