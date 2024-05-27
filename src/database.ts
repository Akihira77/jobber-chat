import { DATABASE_URL } from "@chat/config";
import mongoose from "mongoose";
import { Logger } from "winston";

export const databaseConnection = async (
    logger: (moduleName: string) => Logger
): Promise<void> => {
    try {
        // console.log(DATABASE_URL);
        await mongoose.connect(`${DATABASE_URL}`);
        logger("database.ts - databaseConnection()").info(
            "ChatService MongoDB is connected."
        );

        process.once("exit", async () => {
            await mongoose.connection.close();
        })
    } catch (error) {
        logger("database.ts - databaseConnection()").error(
            "ChatService databaseConnection() method error:",
            error
        );
    }
};
