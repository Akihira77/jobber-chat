import { RABBITMQ_ENDPOINT } from "@chat/config"
import client, { Connection, Channel } from "amqplib"
import { Logger } from "winston"

export class ChatQueue {
    constructor(private logger: (moduleName: string) => Logger) {}

    async createConnection(): Promise<Connection> {
        try {
            const connection: Connection = await client.connect(
                `${RABBITMQ_ENDPOINT}`
            )
            const ch = await connection.createChannel()
            this.logger("queues/connection.ts - createConnection()").info(
                "ChatService connected to RabbitMQ successfully..."
            )
            this.closeConnection(ch, connection)

            return connection
        } catch (error) {
            this.logger("queues/connection.ts - createConnection()").error(
                "ChatService createConnection() method error:",
                error
            )
            process.exit(1)
        }
    }

    async publishDirectMessage(
        ch: Channel,
        exchangeName: string,
        routingKey: string,
        message: string,
        logMessage: string
    ): Promise<void> {
        try {
            await ch.assertExchange(exchangeName, "direct")

            ch.publish(exchangeName, routingKey, Buffer.from(message))
            console.info(logMessage)
        } catch (error) {
            this.logger(
                "queues/chat.producer.ts - publishDirectMessage()"
            ).error(
                "ChatService QueueProducer publishDirectMessage() method error:",
                error
            )
        }
    }

    closeConnection(channel: Channel, connection: Connection): void {
        process.once("SIGINT", async () => {
            await channel.close()
            await connection.close()
        })
    }
}
