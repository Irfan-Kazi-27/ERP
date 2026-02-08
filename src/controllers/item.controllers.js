import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as itemService from "../services/item.services.js";

/**
 * Create item
 * POST /api/items
 */
export const createItem = asyncHandler(async (req, res) => {
    const { name, description, basePrice, unit } = req.body;

    if (!name || !description || !basePrice || !unit) {
        throw new ApiError(400, "All fields are required");
    }

    const itemData = {
        name,
        description,
        basePrice,
        unit
    };

    const item = await itemService.createItem(itemData);

    return res.status(201).json(
        new ApiResponse(201, item, "Item created successfully")
    );
});

/**
 * Update item
 * PATCH /api/items/:id
 */
export const updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const item = await itemService.updateItem(id, updateData);

    return res.status(200).json(
        new ApiResponse(200, item, "Item updated successfully")
    );
});

/**
 * Delete item
 * DELETE /api/items/:id
 */
export const deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await itemService.deleteItem(id);

    return res.status(200).json(
        new ApiResponse(200, item, "Item deleted successfully")
    );
});

/**
 * Get item by ID
 * GET /api/items/:id
 */
export const getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await itemService.getItemById(id);

    return res.status(200).json(
        new ApiResponse(200, item, "Item fetched successfully")
    );
});

/**
 * Get all items
 * GET /api/items
 */
export const getAllItems = asyncHandler(async (req, res) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const filters = { search };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await itemService.getAllItems(filters, pagination);

    return res.status(200).json(
        new ApiResponse(200, result, "Items fetched successfully")
    );
});
