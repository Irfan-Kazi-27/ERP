import { Router } from "express"
import {
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
} from "../controllers/users.controllers.js"
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"

const router = Router()

// Public Routes
router.post('/login', loginUser)

// Secured Routes
router.post('/register', verifyJWT, authorizeRoles("ADMIN", "SUPER_ADMIN", "SUB_ADMIN"), registerUser)
router.post("/logout", verifyJWT, logoutUser)
router.get("/get-current-user", verifyJWT, getCurrentUser)
router.patch("/update-current-user", verifyJWT, updateCurrentUser)
router.delete("/delete-current-user", verifyJWT, deleteCurrentUser)

// Admin/Moderator Routes (Example: restrict getAllUsers to admin)
router.get("/get-all-users", verifyJWT, authorizeRoles("ADMIN", "SUPER_ADMIN", "SUB_ADMIN"), getAllUsers)

// Specific ID Routes
router.get("/get-user-by-id/:id", verifyJWT, getUserById)
router.patch("/update-user-by-id/:id", verifyJWT, updateUserById)
router.delete("/delete-user-by-id/:id", verifyJWT, deleteUserById)
router.get("/get-user-stats", verifyJWT, authorizeRoles("ADMIN", "SUPER_ADMIN", "SUB_ADMIN"), getUserStats)

export default router
