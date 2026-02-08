import connectDB from "./database/connection.js"
import { app } from "./app.js"

connectDB()
    .then(
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    )
    .catch((err) => {
        console.log("MONGODB connection error ", err)
    })
