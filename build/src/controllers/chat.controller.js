"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markSingleMessageAsRead = exports.markMessagesAsRead = exports.updateOffer = exports.findUserMessages = exports.findConversationList = exports.findMessages = exports.findConversation = exports.addMessage = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const message_schema_1 = require("../schemas/message.schema");
const http_status_codes_1 = require("http-status-codes");
const chatService = __importStar(require("../services/chat.service"));
function addMessage(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = message_schema_1.messageSchema.validate(req.body);
        if (error === null || error === void 0 ? void 0 : error.details) {
            throw new jobber_shared_1.BadRequestError(error.details[0].message, "Create message() method");
        }
        let file = req.body.file;
        const randomBytes = crypto_1.default.randomBytes(20);
        const randomCharacters = randomBytes.toString("hex");
        if (file) {
            const result = req.body.fileType === "zip"
                ? yield (0, jobber_shared_1.uploads)(file, `${randomCharacters}.zip`)
                : yield (0, jobber_shared_1.uploads)(file);
            if (!(result === null || result === void 0 ? void 0 : result.public_id)) {
                throw new jobber_shared_1.BadRequestError("File upload error. Try again", "Create message() method");
            }
            file = result === null || result === void 0 ? void 0 : result.secure_url;
        }
        const messageData = {
            conversationId: req.body.conversationId,
            body: req.body.body,
            file,
            fileType: req.body.fileType,
            fileSize: req.body.fileSize,
            fileName: req.body.fileName,
            gigId: req.body.gigId,
            buyerId: req.body.buyerId,
            sellerId: req.body.sellerId,
            senderUsername: req.body.senderUsername,
            senderPicture: req.body.senderPicture,
            receiverUsername: req.body.receiverUsername,
            receiverPicture: req.body.receiverPicture,
            isRead: req.body.isRead,
            hasOffer: req.body.hasOffer,
            offer: req.body.offer
        };
        if (!req.body.hasConversationId) {
            yield chatService.createConversation(String(req.body.conversationId), messageData.senderUsername, messageData.receiverUsername);
        }
        yield chatService.addMessage(req.body.receiverEmail, messageData);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Message added",
            conversationId: req.body.conversationId,
            messageData
        });
    });
}
exports.addMessage = addMessage;
function findConversation(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { senderUsername, receiverUsername } = req.params;
        const conversations = yield chatService.getConversation(senderUsername, receiverUsername);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Chat conversation",
            conversations
        });
    });
}
exports.findConversation = findConversation;
function findMessages(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { senderUsername, receiverUsername } = req.params;
        const messages = yield chatService.getMessages(senderUsername, receiverUsername);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Chat messages",
            messages
        });
    });
}
exports.findMessages = findMessages;
function findConversationList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = req.params;
        const conversations = yield chatService.getUserConversationList(username);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Conversation list",
            conversations
        });
    });
}
exports.findConversationList = findConversationList;
function findUserMessages(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { conversationId } = req.params;
        const messages = yield chatService.getUserMessages(conversationId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Chat messages",
            messages
        });
    });
}
exports.findUserMessages = findUserMessages;
function updateOffer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { messageId, type } = req.body;
        const result = yield chatService.updateOffer(messageId, type);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Message updated",
            singleMessage: result
        });
    });
}
exports.updateOffer = updateOffer;
function markMessagesAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { messageId, senderUsername, receiverUsername } = req.body;
        yield chatService.markMultipleMessagesAsRead(senderUsername, receiverUsername, messageId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Messages marked as read"
        });
    });
}
exports.markMessagesAsRead = markMessagesAsRead;
function markSingleMessageAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { messageId } = req.body;
        const result = yield chatService.markMessageAsRead(messageId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "Message marked as read",
            singleMessage: result
        });
    });
}
exports.markSingleMessageAsRead = markSingleMessageAsRead;
//# sourceMappingURL=chat.controller.js.map