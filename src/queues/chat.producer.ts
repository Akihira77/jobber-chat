import { Channel } from "amqplib";
import { createConnection } from "@chat/queues/connection";
import { logger } from "@chat/config";

export async function publishDirectMessage(
    channel: Channel,
    exchangeName: string,
    routingKey: string,
    message: string,
    logMessage: string
): Promise<void> {
    try {
        if (!channel) {
            channel = (await createConnection()) as Channel;
        }

        await channel.assertExchange(exchangeName, "direct");

        channel.publish(exchangeName, routingKey, Buffer.from(message));

        logger("queues/chat.producer.ts - publishDirectMessage()").info(
            logMessage
        );
    } catch (error) {
        logger("queues/chat.producer.ts - publishDirectMessage()").error(
            "ChatService QueueProducer publishDirectMessage() method error:",
            error
        );
    }
}
