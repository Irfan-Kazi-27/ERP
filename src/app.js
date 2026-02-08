import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

export const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes imports
import userRouter from "./routes/users.routes.js"
import leadRouter from "./routes/lead.routes.js"
import quotationRouter from "./routes/quotation.routes.js"
import followupRouter from "./routes/followup.routes.js"
import orderRouter from "./routes/order.routes.js"
import itemRouter from "./routes/item.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import partyRouter from "./routes/party.routes.js"

// Routes declaration
app.use("/api/users", userRouter)
app.use("/api/leads", leadRouter)
app.use("/api/quotations", quotationRouter)
app.use("/api/followups", followupRouter)
app.use("/api/orders", orderRouter)
app.use("/api/items", itemRouter)
app.use("/api/dashboard", dashboardRouter)
app.use("/api/parties", partyRouter)

import { errorHandler } from "./middlewares/error.middleware.js"
app.use(errorHandler)


