import { winstonLogger } from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@chat/config";
import { Channel } from "amqplib";
import { Logger } from "winston";
import { createConnection } from "@chat/queues/connection";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "chatServiceProducer",
    "debug"
);

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

        log.info(logMessage);
    } catch (error) {
        log.error(
            "ChatService QueueProducer publishDirectMessage() method error:",
            error
        );
    }
}
