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

const ROLE_VISIBILITY = {
    SUPER_ADMIN: {
        canSee: ["SUPER_ADMIN", "ADMIN", "SUB_ADMIN", "STAFF"],
        canDelete: ["ADMIN", "SUB_ADMIN", "STAFF"],
    },
    ADMIN: {
        canSee: ["SUB_ADMIN", "STAFF"],
        canDelete: ["STAFF"],
    },
    SUB_ADMIN: {
        canSee: ["STAFF"],
        canDelete: [],
    },
    STAFF: {
        canSee: ["STAFF"],
        canDelete: [],
    }
};

// ... (other functions: registerUser, loginUser, getUserById, updateUserById - no changes needed)

// Service: Delete user by ID
const deleteUserById = async (userId, requestingUserRole) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const allowedToDelete = ROLE_VISIBILITY[requestingUserRole]?.canDelete || [];
    if (!allowedToDelete.includes(user.role)) {
        throw new ApiError(403, "You do not have permission to delete this user")
    }

    await User.findByIdAndDelete(userId)
    return user
}

// Service: Get all users
const getAllUsers = async ({
    search = "",
    role,
    status = "ACTIVE",
    requestingUserRole
}) => {

    const visibleRoles = ROLE_VISIBILITY[requestingUserRole]?.canSee || [];

    const query = {
        status,
        role: { $in: visibleRoles }
    };

    // Optional role filter from frontend (must be within visible roles)
    if (role) {
        if (visibleRoles.includes(role)) {
            query.role = role;
        } else {
            return []; // Role not visible to user
        }
    }

    // Search by name
    if (search && search.trim() !== "") {
        query.$text = { $search: search };
    }

    const users = await User
        .find(query)
        .select("name email role status isActive createdAt") // avoid sending password
        .sort({ createdAt: -1 });

    return users;
};

// Service: Get user stats (count of Staff and Sub Admin)
const getUserStats = async () => {
    const staffCount = await User.countDocuments({ role: 'STAFF', status: 'ACTIVE' });
    const subAdminCount = await User.countDocuments({ role: 'SUB_ADMIN', status: 'ACTIVE' });

    return {
        staffCount,
        subAdminCount
    };
};

export {
    registerUser,
    loginUser,
    getUserById,
    updateUserById,
    deleteUserById,
    getAllUsers,
    getUserStats
}