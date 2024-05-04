import { databaseConnection } from "@chat/database";
import {
    getUserConversationList,
    updateOffer
} from "@chat/services/message.service";

describe("Update method", () => {
    beforeAll(async () => {
        await databaseConnection();
    });

    describe("updateOffer() method", () => {
        it("should return null because incorrect msgId", async () => {
            const msgs = await getUserConversationList("Wahyu49");
            const result = await updateOffer(msgs[0]._id!.toString(), "accepted");

            expect(result).not.toBeNull();
        });

        it("should return null because incorrect msgId", async () => {
            const msgs = await getUserConversationList("Wahyu49");
            const result = await updateOffer(msgs[0]._id!.toString(), "cancelled");

            expect(result).not.toBeNull();
        });

        it("should return error because offer type is incorrect", async () => {
            const msgs = await getUserConversationList("Wahyu49");
            await expect(updateOffer(
                msgs[0]._id!.toString(),
                "wrong-type"
            )).rejects.toThrow("offer type is incorrect");
        });

        it("should return null because incorrect msgId", async () => {
            const result = await updateOffer("662912bec0d73780bb9ebb80", "cancelled");
            expect(result).toBeNull();
        });
    });
});
