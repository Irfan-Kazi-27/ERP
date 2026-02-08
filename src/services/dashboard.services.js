import { Lead } from "../models/leads.models.js";
import { Order } from "../models/order.model.js";
import { Followup } from "../models/followsUp.models.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Get lead statistics
 * @param {Object} dateRange - Date range filter
 * @returns {Promise<Object>} - Lead statistics
 */
export const getLeadStatistics = async (dateRange = {}) => {
    try {
        const { dateFrom, dateTo } = dateRange;

        let dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.leadDate = {};
            if (dateFrom) dateFilter.leadDate.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.leadDate.$lte = new Date(dateTo);
        }

        // Count by status
        const statusCounts = await Lead.aggregate([
            { $match: { isActive: true, ...dateFilter } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Count by source
        const sourceCounts = await Lead.aggregate([
            { $match: { isActive: true, ...dateFilter } },
            {
                $group: {
                    _id: "$source",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Total leads
        const totalLeads = await Lead.countDocuments({ isActive: true, ...dateFilter });

        return {
            totalLeads,
            byStatus: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            bySource: sourceCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching lead statistics: ${error.message}`);
    }
};

/**
 * Get sales metrics
 * @param {Object} dateRange - Date range filter
 * @param {string} salesPersonId - Sales person ID (optional)
 * @returns {Promise<Object>} - Sales metrics
 */
export const getSalesMetrics = async (dateRange = {}, salesPersonId = null) => {
    try {
        const { dateFrom, dateTo } = dateRange;

        let dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.orderDate = {};
            if (dateFrom) dateFilter.orderDate.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.orderDate.$lte = new Date(dateTo);
        }

        let matchFilter = { ...dateFilter };
        if (salesPersonId) {
            matchFilter.salesPerson = salesPersonId;
        }

        // Total orders and revenue
        const orderStats = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    avgOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        // Orders by status
        const ordersByStatus = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Top sales persons (if not filtered by specific sales person)
        let topSalesPersons = [];
        if (!salesPersonId) {
            topSalesPersons = await Order.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: "$salesPerson",
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { totalRevenue: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "salesPerson"
                    }
                },
                { $unwind: "$salesPerson" },
                {
                    $project: {
                        name: "$salesPerson.name",
                        email: "$salesPerson.email",
                        totalOrders: 1,
                        totalRevenue: 1
                    }
                }
            ]);
        }

        const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };

        return {
            totalOrders: stats.totalOrders,
            totalRevenue: stats.totalRevenue,
            avgOrderValue: stats.avgOrderValue,
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item._id] = {
                    count: item.count,
                    totalAmount: item.totalAmount
                };
                return acc;
            }, {}),
            topSalesPersons
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching sales metrics: ${error.message}`);
    }
};

/**
 * Get order dashboard
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Object>} - Order pipeline view
 */
export const getOrderDashboard = async (filters = {}) => {
    try {
        const { salesPersonId } = filters;

        let matchFilter = {};
        if (salesPersonId) {
            matchFilter.salesPerson = salesPersonId;
        }

        // Orders by status with details
        const pipeline = await Order.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent orders
        const recentOrders = await Order.find(matchFilter)
            .populate('salesPerson', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('orderNo customer.name customer.companyName totalAmount status orderDate');

        // Pending PO orders
        const pendingPO = await Order.countDocuments({
            ...matchFilter,
            status: { $in: ["CREATED", "PO_PENDING"] }
        });

        return {
            pipeline: pipeline.reduce((acc, item) => {
                acc[item._id] = {
                    count: item.count,
                    totalAmount: item.totalAmount
                };
                return acc;
            }, {}),
            recentOrders,
            pendingPO
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching order dashboard: ${error.message}`);
    }
};

/**
 * Get follow-up reminders
 * @param {string} salesPersonId - Sales person ID (optional)
 * @returns {Promise<Object>} - Follow-up reminders
 */
export const getFollowupReminders = async (salesPersonId = null) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Upcoming follow-ups
        const upcomingFollowups = await Followup.find({
            nextFollowupDate: {
                $gte: today,
                $lte: nextWeek
            }
        })
            .populate({
                path: 'lead',
                populate: {
                    path: 'assignedTo',
                    select: 'name email'
                }
            })
            .sort({ nextFollowupDate: 1 });

        // Filter by sales person if provided
        let filteredFollowups = upcomingFollowups;
        if (salesPersonId) {
            filteredFollowups = upcomingFollowups.filter(f =>
                f.lead.assignedTo && f.lead.assignedTo._id.toString() === salesPersonId
            );
        }

        // Overdue follow-ups
        const overdueFollowups = await Followup.find({
            nextFollowupDate: { $lt: today }
        })
            .populate({
                path: 'lead',
                populate: {
                    path: 'assignedTo',
                    select: 'name email'
                }
            })
            .sort({ nextFollowupDate: 1 });

        let filteredOverdue = overdueFollowups;
        if (salesPersonId) {
            filteredOverdue = overdueFollowups.filter(f =>
                f.lead.assignedTo && f.lead.assignedTo._id.toString() === salesPersonId
            );
        }

        return {
            upcoming: filteredFollowups,
            overdue: filteredOverdue,
            totalUpcoming: filteredFollowups.length,
            totalOverdue: filteredOverdue.length
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching follow-up reminders: ${error.message}`);
    }
};
