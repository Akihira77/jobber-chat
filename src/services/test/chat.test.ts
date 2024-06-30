import { winstonLogger } from "@Akihira77/jobber-shared"
import { ELASTIC_SEARCH_URL } from "@chat/config"
import { databaseConnection } from "@chat/database"
import { Logger } from "winston"
import { ChatQueue } from "@chat/queues/chat.queue"

import { ChatService } from "../chat.service"

const logger = (moduleName?: string): Logger =>
    winstonLogger(
        `${ELASTIC_SEARCH_URL}`,
        moduleName ?? "Chat Service",
        "debug"
    )

describe("updateOffer() method", () => {
    let db: any
    let chatService: ChatService
    beforeAll(async () => {
        db = await databaseConnection()
        const queue = new ChatQueue(null, logger)
        chatService = new ChatService(logger, queue)
    })

    afterAll(async () => {
        await db.connection.close()
    })

    it("should return null because incorrect msgId", async () => {
        const id = "662912bec0d73780bb9ebb80"
        const result = await chatService.updateOffer(id, "accepted")

        expect(result).toBeNull()
    })

    it("should return null because incorrect msgId", async () => {
        const id = "662912bec0d73780bb9ebb80"
        const result = await chatService.updateOffer(id, "cancelled")

        expect(result).toBeNull()
    })

    it("should return error because offer type is incorrect", async () => {
        const id = "662912bec0d73780bb9ebb80"
        await expect(chatService.updateOffer(id, "wrong-type")).rejects.toThrow(
            "offer type is incorrect"
        )
    })

    it("should return null because incorrect msgId", async () => {
        const result = await chatService.updateOffer(
            "662912bec0d73780bb9ebb80",
            "cancelled"
        )
        expect(result).toBeNull()
    })
})
