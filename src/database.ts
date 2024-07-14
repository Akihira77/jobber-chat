import { DATABASE_URL } from "@chat/config"
import mongoose, { Mongoose } from "mongoose"

export const databaseConnection = async (): Promise<Mongoose> => {
    const db = await mongoose.connect(`${DATABASE_URL}`, {
        maxConnecting: 20,
        maxIdleTimeMS: 30 * 60 * 1000,
        maxPoolSize: 20,
        minPoolSize: 0
    })

    return db
}
