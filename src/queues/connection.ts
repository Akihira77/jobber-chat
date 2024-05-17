import { logger, RABBITMQ_ENDPOINT } from "@chat/config";
import client, { Connection, Channel } from "amqplib";

export async function createConnection(): Promise<Channel | undefined> {
    try {
        const connection: Connection = await client.connect(
            `${RABBITMQ_ENDPOINT}`
        );
        const channel: Channel = await connection.createChannel();
        logger("queues/connection.ts - createConnection()").info(
            "ChatService connected to RabbitMQ successfully..."
        );
        closeConnection(channel, connection);

        return channel;
    } catch (error) {
        logger("queues/connection.ts - createConnection()").error(
            "ChatService createConnection() method error:",
            error
        );
        return undefined;
    }
}

function closeConnection(channel: Channel, connection: Connection): void {
    process.once("SIGINT", async () => {
        await channel.close();
        await connection.close();
    });
}
