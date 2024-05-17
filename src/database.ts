import { DATABASE_URL, logger } from "@chat/config";
import mongoose from "mongoose";

export const databaseConnection = async (): Promise<void> => {
    try {
        // console.log(DATABASE_URL);
        await mongoose.connect(`${DATABASE_URL}`);
        logger("database.ts - databaseConnection()").info(
            "ChatService MongoDB is connected."
        );
    } catch (error) {
        logger("database.ts - databaseConnection()").error(
            "ChatService databaseConnection() method error:",
            error
        );
    }
};
