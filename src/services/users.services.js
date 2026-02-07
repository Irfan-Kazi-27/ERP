import { User } from "../models/users.models.js"
import { ApiError } from "../utils/ApiError.js"



// Service: Register a new user
const registerUser = async (userData) => {
    const { name, email, phone, password, role } = userData

    if (!name || !email || !phone || !password || !role) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.create({
        name,
        email,
        phone,
        password,
        role
    })

    return user
}

// Service: Authenticate user and generate tokens
const loginUser = async (email, password) => {
    if (!email) throw new ApiError(400, "Email or Phone is required")
    if (!password) throw new ApiError(400, "Password is required")

    const user = await User.findOne({ email })
    if (!user) throw new ApiError(404, "User Not Found")
    
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) throw new ApiError(401, "Invalid Password")

    const accessToken = await user.generateAccessToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password")

    return { user: loggedInUser, accessToken }
}

// Service: Get user by ID
const getUserById = async (userId) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    return user
}

// Service: Update user by ID
const updateUserById = async (userId, updateData) => {
    const { name, email, phone, role } = updateData

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: { name, email, phone, role } },
        { new: true }
    )

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return user
}

// Service: Delete user by ID
const deleteUserById = async (userId) => {
    const user = await User.findByIdAndDelete(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    return user
}

// Service: Get all users
const getAllUsers = async (filters = {}) => {
    const users = await User.find(filters)
    return users
}

export {
    registerUser,
    loginUser,
    getUserById,
    updateUserById,
    deleteUserById,
    getAllUsers
}