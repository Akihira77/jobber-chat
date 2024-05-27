"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMultipleMessagesAsRead = exports.markMessageAsRead = exports.updateOffer = exports.getUserMessages = exports.getMessages = exports.getUserConversationList = exports.getConversation = exports.addMessage = exports.createConversation = void 0;
const config_1 = require("../config");
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const conversation_model_1 = require("../models/conversation.model");
const message_model_1 = require("../models/message.model");
const chat_producer_1 = require("../queues/chat.producer");
const server_1 = require("../server");
const logger = (0, jobber_shared_1.winstonLogger)(`${config_1.ELASTIC_SEARCH_URL}`, "messageService", "debug");
function createConversation(conversationId, senderUsername, receiverUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield conversation_model_1.ConversationModel.create({
                conversationId,
                senderUsername,
                receiverUsername
            });
        }
        catch (error) {
            logger.error("MessageService createConversation() method error", error);
            throw error;
        }
    });
}
exports.createConversation = createConversation;
function addMessage(receiverEmail, request) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messageData = yield message_model_1.MessageModel.create(request);
            if (request.hasOffer) {
                const emailMessageDetails = {
                    receiverEmail,
                    sender: request.senderUsername,
                    amount: `${(_a = request.offer) === null || _a === void 0 ? void 0 : _a.price}`,
                    buyerUsername: (0, jobber_shared_1.lowerCase)(`${request.receiverUsername}`),
                    sellerUsername: (0, jobber_shared_1.lowerCase)(`${request.senderUsername}`),
                    title: (_b = request.offer) === null || _b === void 0 ? void 0 : _b.gigTitle,
                    description: (_c = request.offer) === null || _c === void 0 ? void 0 : _c.description,
                    deliveryDays: `${(_d = request.offer) === null || _d === void 0 ? void 0 : _d.deliveryInDays}`,
                    template: "offer"
                };
                const { notificationService } = config_1.exchangeNamesAndRoutingKeys;
                (0, chat_producer_1.publishDirectMessage)(server_1.chatChannel, notificationService.order.exchangeName, notificationService.order.routingKey, JSON.stringify(emailMessageDetails), "Order email sent to notification service");
            }
            server_1.socketIOChatObject.emit("message_received", messageData);
            return messageData;
        }
        catch (error) {
            logger.error("MessageService addMessage() method error", error);
            throw error;
        }
    });
}
exports.addMessage = addMessage;
function getConversation(senderUsername, receiverUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const queryObject = {
                $or: [
                    { senderUsername, receiverUsername },
                    {
                        senderUsername: receiverUsername,
                        receiverUsername: senderUsername
                    }
                ]
            };
            const conversations = (yield conversation_model_1.ConversationModel.find(queryObject)
                .lean()
                .exec());
            return conversations;
        }
        catch (error) {
            logger.error("MessageService getConversation() method error", error);
            throw error;
        }
    });
}
exports.getConversation = getConversation;
function getUserConversationList(username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const queryObject = {
                $or: [
                    {
                        senderUsername: username
                    },
                    { receiverUsername: username }
                ]
            };
            const messages = yield message_model_1.MessageModel.aggregate([
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
        catch (error) {
            logger.error("MessageService getUserConversationList() method error", error);
            throw error;
        }
    });
}
exports.getUserConversationList = getUserConversationList;
function getMessages(senderUsername, receiverUsername) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const queryObject = {
                $or: [
                    { senderUsername, receiverUsername },
                    {
                        senderUsername: receiverUsername,
                        receiverUsername: senderUsername
                    }
                ]
            };
            const messages = yield message_model_1.MessageModel.find(queryObject, {}, { sort: { createdAt: 1 } })
                .lean()
                .exec();
            return messages;
        }
        catch (error) {
            logger.error("MessageService getMessages() method error", error);
            throw error;
        }
    });
}
exports.getMessages = getMessages;
function getUserMessages(conversationId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messages = yield message_model_1.MessageModel.find({ conversationId }, {}, { sort: { createdAt: 1 } })
                .lean()
                .exec();
            return messages;
        }
        catch (error) {
            logger.error("MessageService getUserMessages() method error", error);
            throw error;
        }
    });
}
exports.getUserMessages = getUserMessages;
function updateOffer(messageId, type) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!["cancelled", "accepted"].includes(type)) {
                throw new jobber_shared_1.BadRequestError("offer type is incorrect", "MessageService updateOffer() method error");
            }
            const result = yield message_model_1.MessageModel.findByIdAndUpdate({ _id: messageId }, {
                $set: {
                    [`offer.${type}`]: true
                }
            }, {
                new: true
            })
                .lean()
                .exec();
            return result;
        }
        catch (error) {
            logger.error("MessageService updateOffer() method error", error);
            throw error;
        }
    });
}
exports.updateOffer = updateOffer;
function markMessageAsRead(messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const message = (yield message_model_1.MessageModel.findByIdAndUpdate({ _id: messageId }, {
                $set: {
                    isRead: true
                }
            }, {
                new: true
            })
                .lean()
                .exec());
            server_1.socketIOChatObject.emit("message_updated", message);
            return message;
        }
        catch (error) {
            logger.error("MessageService markMessageAsRead() method error", error);
            throw error;
        }
    });
}
exports.markMessageAsRead = markMessageAsRead;
function markMultipleMessagesAsRead(receiverUsername, senderUsername, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield message_model_1.MessageModel.updateMany({ senderUsername, receiverUsername, isRead: false }, {
                $set: {
                    isRead: true
                }
            }).exec();
            const message = (yield message_model_1.MessageModel.findOne({
                _id: messageId
            })
                .lean()
                .exec());
            server_1.socketIOChatObject.emit("message_updated", message);
            return message;
        }
        catch (error) {
            logger.error("MessageService markMultipleMessagesAsRead() method error", error);
            throw error;
        }
    });
}
exports.markMultipleMessagesAsRead = markMultipleMessagesAsRead;
//# sourceMappingURL=chat.service.js.map