import crypto from "crypto";

import {
    BadRequestError,
    uploads,
    IMessageDocument,
    IConversationDocument
} from "@Akihira77/jobber-shared";
import { messageSchema } from "@chat/schemas/message.schema";
import { ChatService } from "@chat/services/chat.service";

export class ChatHandler {
    constructor(private chatService: ChatService) {}

    async addMessage(reqBody: any): Promise<IMessageDocument> {
        const { error, value } = messageSchema.validate(reqBody);

        if (error?.details) {
            throw new BadRequestError(
                error.details[0].message,
                "Create message() method"
            );
        }

        let file: string = value.file;
        const randomBytes: Buffer = crypto.randomBytes(20);
        const randomCharacters: string = randomBytes.toString("hex");

        if (file) {
            const result =
                value.fileType === "zip"
                    ? await uploads(file, `${randomCharacters}.zip`)
                    : await uploads(file);

            if (!result?.public_id) {
                throw new BadRequestError(
                    "File upload error. Try again",
                    "Create message() method"
                );
            }

            file = result?.secure_url;
        }

        const messageData: IMessageDocument = {
            conversationId: value.conversationId,
            body: value.body,
            file,
            fileType: value.fileType,
            fileSize: value.fileSize,
            fileName: value.fileName,
            gigId: value.gigId,
            buyerId: value.buyerId,
            sellerId: value.sellerId,
            senderUsername: value.senderUsername,
            senderPicture: value.senderPicture,
            receiverUsername: value.receiverUsername,
            receiverPicture: value.receiverPicture,
            isRead: value.isRead,
            hasOffer: value.hasOffer,
            offer: value.offer
        };

        if (!value.hasConversationId) {
            await this.chatService.createConversation(
                String(value.conversationId),
                messageData.senderUsername!,
                messageData.receiverUsername!
            );
        }

        await this.chatService.addMessage(reqBody.receiverEmail, messageData);

        return messageData;
    }

    async findConversation(
        senderUsername: string,
        receiverUsername: string
    ): Promise<IConversationDocument[]> {
        const conversations: IConversationDocument[] =
            await this.chatService.getConversation(
                senderUsername,
                receiverUsername
            );

        return conversations;
    }

    async findMessages(
        senderUsername: string,
        receiverUsername: string
    ): Promise<IMessageDocument[]> {
        const messages: IMessageDocument[] = await this.chatService.getMessages(
            senderUsername,
            receiverUsername
        );

        return messages;
    }

    async findConversationList(username: string): Promise<IMessageDocument[]> {
        const conversations: IMessageDocument[] =
            await this.chatService.getUserConversationList(username);

        return conversations;
    }

    async findUserMessages(
        conversationId: string
    ): Promise<IMessageDocument[]> {
        const messages: IMessageDocument[] =
            await this.chatService.getUserMessages(conversationId);

        return messages;
    }

    async updateOffer(
        messageId: string,
        type: string
    ): Promise<IMessageDocument | null> {
        const result = await this.chatService.updateOffer(messageId, type);

        return result;
    }

    async markMessagesAsRead(
        messageId: string,
        senderUsername: string,
        receiverUsername: string
    ): Promise<IMessageDocument> {
        const message = await this.chatService.markMultipleMessagesAsRead(
            senderUsername,
            receiverUsername,
            messageId
        );

        return message;
    }

    async markSingleMessageAsRead(
        messageId: string
    ): Promise<IMessageDocument> {
        const result = await this.chatService.markMessageAsRead(messageId);

        return result;
    }
}
