import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"

const errorHandler = (err, req, res, next) => {
    let error = err

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500
        const message = error.message || "Something went wrong"
        error = new ApiError(statusCode, message, error?.errors || [], error.stack)
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
    }

    return res.status(error.statuscode || 500).json(response)
}

export { errorHandler }
