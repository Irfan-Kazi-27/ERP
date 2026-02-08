import { Order } from "../models/order.model.js";
import { Quotation } from "../models/quotation.models.js";
import { Lead } from "../models/leads.models.js";
import { generateOrderNumber } from "../utils/autoNumber.helper.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Convert approved quotation to order
 * @param {string} quotationId - Quotation ID
 * @param {string} convertedBy - User ID who converted
 * @returns {Promise<Object>} - Created order
 */
export const convertQuotationToOrder = async (quotationId, convertedBy) => {
    try {
        const quotation = await Quotation.findById(quotationId)
            .populate('leadId')
            .populate('quotationItems.itemId');

        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        if (quotation.status !== "APPROVED") {
            throw new ApiError(400, `Quotation must be approved before conversion. Current status: ${quotation.status}`);
        }

        // Check if order already exists for this quotation
        const existingOrder = await Order.findOne({ quotation: quotationId });
        if (existingOrder) {
            throw new ApiError(400, "Order already exists for this quotation");
        }

        // Generate order number
        const orderNo = await generateOrderNumber();

        // Prepare order items from quotation items
        const orderItems = quotation.quotationItems.map(item => ({
            itemId: item.itemId._id,
            quantity: item.quantity,
            unitPrice: item.UnitPrice,
            total: item.Total
        }));

        // Create order
        const order = await Order.create({
            orderNo,
            lead: quotation.leadId._id,
            quotation: quotationId,
            customer: quotation.leadId.customer,
            salesPerson: quotation.salesPersonId,
            orderItems,
            totalAmount: quotation.totalAmount,
            status: "CREATED"
        });

        // Update lead status
        await Lead.findByIdAndUpdate(quotation.leadId._id, {
            status: "CONVERTED_TO_ORDER"
        });

        return await Order.findById(order._id)
            .populate('lead')
            .populate('quotation')
            .populate('salesPerson', 'name email')
            .populate('orderItems.itemId', 'name description unit');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error converting quotation to order: ${error.message}`);
    }
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Order details
 */
export const getOrderById = async (orderId) => {
    try {
        const order = await Order.findById(orderId)
            .populate('lead')
            .populate('quotation')
            .populate('salesPerson', 'name email')
            .populate('orderItems.itemId', 'name description unit')
            .populate('poDetails.punchedBy', 'name email');

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        return order;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error fetching order: ${error.message}`);
    }
};

/**
 * Get all orders with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Object>} - Orders list with pagination
 */
export const getAllOrders = async (filters = {}, pagination = {}, userId, userRole) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};

        // Role-based filtering
        if (userRole === "STAFF") {
            query.salesPerson = userId;
        }

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.salesPerson) {
            query.salesPerson = filters.salesPerson;
        }

        if (filters.dateFrom || filters.dateTo) {
            query.orderDate = {};
            if (filters.dateFrom) {
                query.orderDate.$gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                query.orderDate.$lte = new Date(filters.dateTo);
            }
        }

        if (filters.search) {
            query.$or = [
                { 'customer.name': { $regex: filters.search, $options: 'i' } },
                { 'customer.companyName': { $regex: filters.search, $options: 'i' } },
                { orderNo: { $regex: filters.search, $options: 'i' } }
            ];
        }

        // Execute query
        const orders = await Order.find(query)
            .populate('lead', 'leadNo status')
            .populate('quotation', 'quotationNo')
            .populate('salesPerson', 'name email')
            .populate('orderItems.itemId', 'name unit')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        return {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching orders: ${error.message}`);
    }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated order
 */
export const updateOrderStatus = async (orderId, status) => {
    try {
        const validStatuses = ["CREATED", "PO_PENDING", "PO_RECEIVED", "CONFIRMED", "CANCELLED"];

        if (!validStatuses.includes(status)) {
            throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        order.status = status;

        if (status === "CONFIRMED") {
            order.confirmedAt = new Date();
        }

        await order.save();

        return await Order.findById(orderId)
            .populate('lead')
            .populate('quotation')
            .populate('salesPerson', 'name email')
            .populate('orderItems.itemId', 'name description unit');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating order status: ${error.message}`);
    }
};

/**
 * Add PO details to order
 * @param {string} orderId - Order ID
 * @param {Object} poData - PO data
 * @param {string} punchedBy - User ID who punched PO
 * @returns {Promise<Object>} - Updated order
 */
export const addPOToOrder = async (orderId, poData, punchedBy) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (order.status === "CANCELLED") {
            throw new ApiError(400, "Cannot add PO to cancelled order");
        }

        order.poDetails = {
            poNumber: poData.poNumber,
            poDate: poData.poDate,
            poFile: poData.poFile,
            poAmount: poData.poAmount,
            punchedBy: punchedBy,
            punchedAt: new Date()
        };

        order.status = "PO_RECEIVED";

        await order.save();

        return await Order.findById(orderId)
            .populate('lead')
            .populate('quotation')
            .populate('salesPerson', 'name email')
            .populate('orderItems.itemId', 'name description unit')
            .populate('poDetails.punchedBy', 'name email');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error adding PO to order: ${error.message}`);
    }
};
