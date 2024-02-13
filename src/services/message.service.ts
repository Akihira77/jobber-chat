import { exchangeNamesAndRoutingKeys } from "@chat/config";
import {
    IConversationDocument,
    IMessageDetails,
    IMessageDocument,
    lowerCase
} from "@Akihira77/jobber-shared";
import { ConversationModel } from "@chat/models/conversation.model";
import { MessageModel } from "@chat/models/message.model";
import { publishDirectMessage } from "@chat/queues/chat.producer";
import { chatChannel, socketIOChatObject } from "@chat/server";

export async function createConversation(
    conversationId: string,
    senderUsername: string,
    receiverUsername: string
): Promise<void> {
    await ConversationModel.create({
        conversationId,
        senderUsername,
        receiverUsername
    });
}

export async function addMessage(
    request: IMessageDocument
): Promise<IMessageDocument> {
    const messageData: IMessageDocument = await MessageModel.create(request);

    if (request.hasOffer) {
        const emailMessageDetails: IMessageDetails = {
            sender: request.senderUsername,
            amount: `${request.offer?.price}`,
            buyerUsername: lowerCase(`${request.receiverUsername}`),
            sellerUsername: lowerCase(`${request.senderUsername}`),
            title: request.offer?.gigTitle,
            description: request.offer?.description,
            deliveryDays: `${request.offer?.deliveryInDays}`,
            template: "offer"
        };

        const { notificationService } = exchangeNamesAndRoutingKeys;

        await publishDirectMessage(
            chatChannel,
            notificationService.order.exchangeName,
            notificationService.order.routingKey,
            JSON.stringify(emailMessageDetails),
            "Order email sent to notification service"
        );
    }

    socketIOChatObject.emit("message_received", messageData);
    return messageData;
}

export async function getConversation(
    senderUsername: string,
    receiverUsername: string
): Promise<IConversationDocument[]> {
    const queryObject = {
        $or: [
            { senderUsername, receiverUsername },
            {
                senderUsername: receiverUsername,
                receiverUsername: senderUsername
            }
        ]
    };

    const conversations = (await ConversationModel.find(queryObject)
        .lean()
        .exec()) as IConversationDocument[];

    return conversations;
}

export async function getUserConversationList(
    username: string
): Promise<IMessageDocument[]> {
    const queryObject = {
        $or: [
            {
                senderUsername: username
            },
            { receiverUsername: username }
        ]
    };

    const messages: IMessageDocument[] = await MessageModel.aggregate([
        {
            $match: queryObject
        },
        {
            $group: {
                _id: "$conversationId",
                result: {
                    $top: {
                        output: "$$ROOT",
                        sortBy: { createdAt: -1 } //desc
                    }
                }
            }
        },
        {
            $project: {
                _id: "$result._id",
                conversationId: "$result.conversationId",
                sellerId: "$result.sellerId",
                buyerId: "$result.buyerId",
                receiverUsername: "$result.receiverUsername",
                receiverPicture: "$result.receiverPicture",
                senderUsername: "$result.senderUsername",
                senderPicture: "$result.senderPicture",
                body: "$result.body",
                file: "$result.file",
                gigId: "$result.gigId",
                isRead: "$result.isRead",
                hasOffer: "$result.hasOffer",
                createdAt: "$result.createdAt"
            }
        }
    ]);

    return messages;
}

export async function getMessages(
    senderUsername: string,
    receiverUsername: string
): Promise<IMessageDocument[]> {
    const queryObject = {
        $or: [
            { senderUsername, receiverUsername },
            {
                senderUsername: receiverUsername,
                receiverUsername: senderUsername
            }
        ]
    };

    // const messages: IMessageDocument[] = await MessageModel.aggregate([
    //     {
    //         $match: queryObject
    //     },
    //     {
    //         $sort: {
    //             createdAt: 1 // asc
    //         }
    //     }
    // ]);

    const messages: IMessageDocument[] = await MessageModel.find(
        queryObject,
        {},
        { sort: { createdAt: 1 } }
    )
        .lean()
        .exec();

    return messages;
}

export async function getUserMessages(
    conversationId: string
): Promise<IMessageDocument[]> {
    // const messages: IMessageDocument[] = await MessageModel.aggregate([
    //     { $match: { conversationId: messageConversationId } },
    //     { $sort: { createdAt: 1 } }
    // ]);

    const messages: IMessageDocument[] = await MessageModel.find(
        { conversationId },
        {},
        { sort: { createdAt: 1 } }
    )
        .lean()
        .exec();

    return messages;
}

export async function updateOffer(
    messageId: string,
    type: string
): Promise<IMessageDocument> {
    const result = (await MessageModel.findByIdAndUpdate(
        { _id: messageId },
        {
            $set: {
                [`offer.${type}`]: true
            }
        },
        {
            new: true
        }
    ).exec()) as IMessageDocument;

    return result;
}

export async function markMessageAsRead(
    messageId: string
): Promise<IMessageDocument> {
    const result = (await MessageModel.findByIdAndUpdate(
        { _id: messageId },
        {
            $set: {
                isRead: true
            }
        },
        {
            new: true
        }
    ).exec()) as IMessageDocument;

    socketIOChatObject.emit("message_updated", result);

    return result;
}

export async function markMultipleMessagesAsRead(
    receiverUsername: string,
    senderUsername: string,
    messageId: string
): Promise<IMessageDocument> {
    await MessageModel.updateMany(
        { senderUsername, receiverUsername, isRead: false },
        {
            $set: {
                isRead: true
            }
        }
    ).exec();

    const message = (await MessageModel.findOne({
        _id: messageId
    })
        .lean()
        .exec()) as IMessageDocument;

    socketIOChatObject.emit("message_updated", message);

    return message;
}
