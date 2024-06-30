import { DATABASE_URL } from "@chat/config"
import mongoose, { Mongoose } from "mongoose"

export const databaseConnection = async (): Promise<Mongoose> => {
    try {
        // console.log(DATABASE_URL);
        const db = await mongoose.connect(`${DATABASE_URL}`)
        return db
    } catch (error) {
        console.log(error)
        throw error
    }
}
