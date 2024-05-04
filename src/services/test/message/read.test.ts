import { databaseConnection } from "@chat/database";
import { getUserConversationList } from "@chat/services/message.service";

describe("Read/Get method", () => {
    beforeAll(async () => {
        await databaseConnection();
    });



    describe("getUserConversationList() method", () => {
        it("Should return array of conversations and the required fields", async () => {
            const requiredFields = [
                "_id",
                "conversationId",
                "sellerId",
                "buyerId",
                "receiverUsername",
                "receiverPicture",
                "senderUsername",
                "senderPicture",
                "body",
                "file",
                "gigId",
                "isRead",
                "hasOffer",
                "createdAt"
            ];
            const msgList = await getUserConversationList("Wahyu49");

            msgList.forEach((msg) => {
                const msgObj = Object.keys(msg);
                expect(msgObj).toEqual(requiredFields);
            });
        });

        it("Should return empty array", async () => {
            const msgList = await getUserConversationList("not-found-user");

            expect(msgList).toEqual([]);
        });
    });
});
