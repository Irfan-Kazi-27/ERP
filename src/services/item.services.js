import { Item } from "../models/items.models.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create new item
 * @param {Object} itemData - Item data
 * @returns {Promise<Object>} - Created item
 */
export const createItem = async (itemData) => {
    try {
        const item = await Item.create(itemData);
        return item;
    } catch (error) {
        throw new ApiError(500, `Error creating item: ${error.message}`);
    }
};

/**
 * Update item
 * @param {string} itemId - Item ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated item
 */
export const updateItem = async (itemId, updateData) => {
    try {
        const item = await Item.findById(itemId);
        if (!item) {
            throw new ApiError(404, "Item not found");
        }

        if (updateData.name) item.name = updateData.name;
        if (updateData.description) item.description = updateData.description;
        if (updateData.basePrice) item.basePrice = updateData.basePrice;
        if (updateData.unit) item.unit = updateData.unit;

        await item.save();
        return item;

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating item: ${error.message}`);
    }
};

/**
 * Delete item (soft delete)
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} - Deleted item
 */
export const deleteItem = async (itemId) => {
    try {
        const item = await Item.findById(itemId);
        if (!item) {
            throw new ApiError(404, "Item not found");
        }

        item.isActive = false;
        await item.save();

        return item;

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error deleting item: ${error.message}`);
    }
};

/**
 * Get item by ID
 * @param {string} itemId - Item ID
 * @returns {Promise<Object>} - Item details
 */
export const getItemById = async (itemId) => {
    try {
        const item = await Item.findById(itemId);
        if (!item) {
            throw new ApiError(404, "Item not found");
        }

        return item;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error fetching item: ${error.message}`);
    }
};

/**
 * Get all items with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Items list with pagination
 */
export const getAllItems = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
        const skip = (page - 1) * limit;

        // Build query
        let query = { isActive: true };

        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }

        // Execute query
        const items = await Item.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Item.countDocuments(query);

        return {
            items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching items: ${error.message}`);
    }
};
