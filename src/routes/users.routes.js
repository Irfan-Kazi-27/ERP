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
    deleteUserById
} from "../controllers/users.controllers.js"
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"

const router = Router()

// Public Routes
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/me").get(verifyJWT, getCurrentUser)
router.route("/update-me").patch(verifyJWT, updateCurrentUser)
router.route("/delete-me").delete(verifyJWT, deleteCurrentUser)

// Admin/Moderator Routes (Example: restrict getAllUsers to admin)
router.route("/").get(verifyJWT, authorizeRoles("admin"), getAllUsers)

// Specific ID Routes
router.route("/:id")
    .get(verifyJWT, getUserById)
    .patch(verifyJWT, updateUserById)
    .delete(verifyJWT, deleteUserById)

export default router
