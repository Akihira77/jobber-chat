import crypto from "crypto"

import {
    BadRequestError,
    uploads,
    IMessageDocument,
    IConversationDocument
} from "@Akihira77/jobber-shared"
import { MessageSchema } from "@chat/schemas/message.schema"
import { ChatService } from "@chat/services/chat.service"
import typia from "typia"
import { RedisClient } from "../redis"

export class ChatHandler {
    constructor(
        private chatService: ChatService,
        private readonly redis: RedisClient
    ) {}

    async addMessage(reqBody: any): Promise<IMessageDocument> {
        try {
            const res = typia.validateEquals<MessageSchema>(reqBody)

            if (!res.success) {
                throw new BadRequestError(
                    res.errors[0].expected,
                    "Create message() method"
                )
            }

            if (res.data.file) {
                const randomBytes: Buffer = await Promise.resolve(
                    crypto.randomBytes(20)
                )
                const randomCharacters: string = randomBytes.toString("hex")
                const result =
                    res.data.fileType === "zip"
                        ? await uploads(
                              res.data.file,
                              `${randomCharacters}.zip`
                          )
                        : await uploads(res.data.file)

                if (!result?.public_id) {
                    throw new BadRequestError(
                        "File upload error. Try again",
                        "Create message() method"
                    )
                }

                res.data.file = result?.secure_url
            }

            const cachedConversationId = await this.redis.getDataFromCache(
                res.data.conversationId ?? ""
            )

            if (!cachedConversationId) {
                const conversationsFromDb =
                    await this.chatService.getConversation(
                        res.data.senderUsername,
                        res.data.receiverUsername
                    )
                if (conversationsFromDb.length > 0) {
                    res.data.conversationId =
                        conversationsFromDb[0].conversationId
                } else {
                    res.data.conversationId =
                        await this.chatService.createConversation(
                            String(res.data.conversationId),
                            res.data.senderUsername!,
                            res.data.receiverUsername!
                        )
                }

                await this.redis.setDataToCache(
                    res.data.conversationId,
                    res.data.conversationId,
                    false,
                    Infinity
                )
            }

            const messageData = await this.chatService.addMessage(
                reqBody.receiverEmail,
                res.data
            )

            return messageData
        } catch (error) {
            console.log(error)
            throw error
        }
    }

    async findConversation(
        senderUsername: string,
        receiverUsername: string
    ): Promise<IConversationDocument[]> {
        const conversations: IConversationDocument[] =
            await this.chatService.getConversation(
                senderUsername,
                receiverUsername
            )

        return conversations
    }

    async findMessages(
        senderUsername: string,
        receiverUsername: string
    ): Promise<IMessageDocument[]> {
        const messages: IMessageDocument[] = await this.chatService.getMessages(
            senderUsername,
            receiverUsername
        )

        return messages
    }

    async findConversationList(username: string): Promise<IMessageDocument[]> {
        const conversations: IMessageDocument[] =
            await this.chatService.getUserConversationList(username)

        return conversations
    }

    async findUserMessages(
        conversationId: string
    ): Promise<IMessageDocument[]> {
        const messages: IMessageDocument[] =
            await this.chatService.getUserMessages(conversationId)

        return messages
    }

    async updateOffer(
        messageId: string,
        type: string
    ): Promise<IMessageDocument | null> {
        const result = await this.chatService.updateOffer(messageId, type)

        return result
    }

    async markMessagesAsRead(
        messageId: string,
        senderUsername: string,
        receiverUsername: string
    ): Promise<IMessageDocument | null> {
        const message = await this.chatService.markMultipleMessagesAsRead(
            senderUsername,
            receiverUsername,
            messageId
        )

        return message
    }

    async markSingleMessageAsRead(
        messageId: string
    ): Promise<IMessageDocument | null> {
        const result = await this.chatService.markMessageAsRead(messageId)

        return result
    }
}
