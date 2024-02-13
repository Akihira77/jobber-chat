import { IMessageDocument } from "@Akihira77/jobber-shared";
import { Model, Schema, model } from "mongoose";

const messageSchema: Schema = new Schema(
    {
        conversationId: {
            type: String,
            required: true,
            index: true
        },
        senderUsername: {
            type: String,
            required: true,
            index: true
        },
        receiverUsername: {
            type: String,
            required: true,
            index: true
        },
        senderPicture: {
            type: String,
            required: true
        },
        receiverPicture: {
            type: String,
            required: true
        },
        body: {
            type: String,
            default: ""
        },
        file: {
            type: String,
            default: ""
        },
        fileType: {
            type: String,
            default: ""
        },
        fileName: {
            type: String,
            default: ""
        },
        fileSize: {
            type: String,
            default: ""
        },
        gigId: {
            type: String,
            default: ""
        },
        sellerId: {
            type: String,
            required: true
        },
        buyerId: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            required: false
        },
        hasOffer: {
            type: Boolean,
            required: false
        },
        offer: {
            gigTitle: {
                type: String,
                default: ""
            },
            price: {
                type: Number,
                default: 0
            },
            description: {
                type: String,
                default: ""
            },
            deliveryInDays: {
                type: Number,
                default: 0
            },
            oldDeliveryDate: {
                type: String,
                default: ""
            },
            newDeliveryDate: {
                type: String,
                default: ""
            },
            accepted: {
                type: Boolean,
                default: false
            },
            cancelled: {
                type: Boolean,
                default: false
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false
    }
);

export const MessageModel: Model<IMessageDocument> = model<IMessageDocument>(
    "Message",
    messageSchema,
    "Message"
);
