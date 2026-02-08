import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import * as userService from "../services/users.services.js"


const options = {
    httpOnly: true,
    secure: true,
}
// Controller: Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const user = await userService.registerUser(req.body)
    return res.status(201).json(
        new ApiResponse(200, user, "User registered successfully")
    )
})

// Controller: Login user
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const { user, accessToken } = await userService.loginUser(email, password)

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, {
                user,
                accessToken,
            }, "User logged in successfully")
        )
})

// Controller: Logout user
const logoutUser = asyncHandler(async (req, res) => {

    return res.status(200)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

// Controller: Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched successfully")
    )
})

// Controller: Update current user
const updateCurrentUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUserById(req.user._id, req.body)
    return res.status(200).json(
        new ApiResponse(200, user, "User updated successfully")
    )
})

// Controller: Delete current user
const deleteCurrentUser = asyncHandler(async (req, res) => {
    const user = await userService.deleteUserById(req.user._id)
    return res.status(200).json(
        new ApiResponse(200, user, "User deleted successfully")
    )
})

// Controller: Get all users
const getAllUsers = asyncHandler(async (req, res) => {
    const { search, role, status } = req.query;
    const users = await userService.getAllUsers({
        search,
        role,
        status,
        requestingUserRole: req.user.role
    });
    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    )
})

// Controller: Get user by ID
const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id)
    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    )
})

// Controller: Update user by ID
const updateUserById = asyncHandler(async (req, res) => {
    const user = await userService.updateUserById(req.params.id, req.body)
    return res.status(200).json(
        new ApiResponse(200, user, "User updated successfully")
    )
})

// Controller: Delete user by ID
const deleteUserById = asyncHandler(async (req, res) => {
    const user = await userService.deleteUserById(req.params.id, req.user.role)
    return res.status(200).json(
        new ApiResponse(200, user, "User deleted successfully")
    )
})


// Controller: Get user stats
const getUserStats = asyncHandler(async (req, res) => {
    const stats = await userService.getUserStats();
    return res.status(200).json(
        new ApiResponse(200, stats, "User stats fetched successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    updateCurrentUser,
    deleteCurrentUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getUserStats
}
