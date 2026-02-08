import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as dashboardService from "../services/dashboard.services.js";

/**
 * Get lead statistics
 * GET /api/dashboard/leads
 */
export const getLeadStatistics = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;

    const dateRange = { dateFrom, dateTo };

    const statistics = await dashboardService.getLeadStatistics(dateRange);

    return res.status(200).json(
        new ApiResponse(200, statistics, "Lead statistics fetched successfully")
    );
});

/**
 * Get sales metrics
 * GET /api/dashboard/sales
 */
export const getSalesMetrics = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, salesPersonId } = req.query;

    const dateRange = { dateFrom, dateTo };

    // If user is STAFF, only show their metrics
    const targetSalesPersonId = req.user.role === "STAFF" ? req.user._id : salesPersonId;

    const metrics = await dashboardService.getSalesMetrics(dateRange, targetSalesPersonId);

    return res.status(200).json(
        new ApiResponse(200, metrics, "Sales metrics fetched successfully")
    );
});

/**
 * Get order dashboard
 * GET /api/dashboard/orders
 */
export const getOrderDashboard = asyncHandler(async (req, res) => {
    const { salesPersonId } = req.query;

    // If user is STAFF, only show their orders
    const targetSalesPersonId = req.user.role === "STAFF" ? req.user._id : salesPersonId;

    const filters = { salesPersonId: targetSalesPersonId };

    const dashboard = await dashboardService.getOrderDashboard(filters);

    return res.status(200).json(
        new ApiResponse(200, dashboard, "Order dashboard fetched successfully")
    );
});

/**
 * Get follow-up reminders
 * GET /api/dashboard/reminders
 */
export const getFollowupReminders = asyncHandler(async (req, res) => {
    // If user is STAFF, only show their reminders
    const salesPersonId = req.user.role === "STAFF" ? req.user._id : null;

    const reminders = await dashboardService.getFollowupReminders(salesPersonId);

    return res.status(200).json(
        new ApiResponse(200, reminders, "Follow-up reminders fetched successfully")
    );
});
