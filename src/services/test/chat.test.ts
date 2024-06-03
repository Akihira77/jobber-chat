import { winstonLogger } from "@Akihira77/jobber-shared";
import { ELASTIC_SEARCH_URL } from "@chat/config";
import { databaseConnection } from "@chat/database";
import { Logger } from "winston";
import { ChatQueue } from "@chat/queues/chat.queue";

import { ChatService } from "../chat.service";

const logger = (moduleName?: string): Logger =>
    winstonLogger(
        `${ELASTIC_SEARCH_URL}`,
        moduleName ?? "Chat Service",
        "debug"
    );

describe("updateOffer() method", () => {
    let db: any;
    let chatService: ChatService;
    beforeAll(async () => {
        db = await databaseConnection(logger);
        const queue = new ChatQueue(null, logger);
        chatService = new ChatService(logger, queue);
    });

    afterAll(async () => {
        await db.connection.close();
    });

    it("should return null because incorrect msgId", async () => {
        const msgs = await chatService.getUserConversationList("Wahyu49");
        const result = await chatService.updateOffer(
            msgs[0]._id!.toString(),
            "accepted"
        );

        expect(result).not.toBeNull();
    });

    it("should return null because incorrect msgId", async () => {
        const msgs = await chatService.getUserConversationList("Wahyu49");
        const result = await chatService.updateOffer(
            msgs[0]._id!.toString(),
            "cancelled"
        );

        expect(result).not.toBeNull();
    });

    it("should return error because offer type is incorrect", async () => {
        const msgs = await chatService.getUserConversationList("Wahyu49");
        await expect(
            chatService.updateOffer(msgs[0]._id!.toString(), "wrong-type")
        ).rejects.toThrow("offer type is incorrect");
    });

    it("should return null because incorrect msgId", async () => {
        const result = await chatService.updateOffer(
            "662912bec0d73780bb9ebb80",
            "cancelled"
        );
        expect(result).toBeNull();
    });
});
