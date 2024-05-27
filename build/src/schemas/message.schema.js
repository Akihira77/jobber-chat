"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const messageSchema = joi_1.default.object().keys({
    conversationId: joi_1.default.string().optional().allow(null, ""),
    _id: joi_1.default.string().optional(),
    body: joi_1.default.string().optional().allow(null, ""),
    hasConversationId: joi_1.default.boolean().optional(), // this is only for checking if conversation id exist
    file: joi_1.default.string().optional().allow(null, ""),
    fileType: joi_1.default.string().optional().allow(null, ""),
    fileName: joi_1.default.string().optional().allow(null, ""),
    fileSize: joi_1.default.string().optional().allow(null, ""),
    gigId: joi_1.default.string().optional().allow(null, ""),
    sellerId: joi_1.default.string().required().messages({
        "string.base": "Seller id is required",
        "string.empty": "Seller id is required",
        "any.required": "Seller id is required"
    }),
    buyerId: joi_1.default.string().required().messages({
        "string.base": "Buyer id is required",
        "string.empty": "Buyer id is required",
        "any.required": "Buyer id is required"
    }),
    senderUsername: joi_1.default.string().required().messages({
        "string.base": "Sender username is required",
        "string.empty": "Sender username is required",
        "any.required": "Sender username is required"
    }),
    senderPicture: joi_1.default.string().required().messages({
        "string.base": "Sender picture is required",
        "string.empty": "Sender picture is required",
        "any.required": "Sender picture is required"
    }),
    receiverUsername: joi_1.default.string().required().messages({
        "string.base": "Receiver username is required",
        "string.empty": "Receiver username is required",
        "any.required": "Receiver username is required"
    }),
    receiverEmail: joi_1.default.string().required().messages({
        "string.base": "Receiver email is required",
        "string.empty": "Receiver email is required",
        "any.required": "Receiver email is required"
    }),
    receiverPicture: joi_1.default.string().required().messages({
        "string.base": "Receiver picture is required",
        "string.empty": "Receiver picture is required",
        "any.required": "Receiver picture is required"
    }),
    isRead: joi_1.default.boolean().optional(),
    hasOffer: joi_1.default.boolean().optional(),
    offer: joi_1.default.object({
        gigTitle: joi_1.default.string().optional(),
        price: joi_1.default.number().optional(),
        description: joi_1.default.string().optional(),
        deliveryInDays: joi_1.default.number().optional(),
        oldDeliveryDate: joi_1.default.string().optional(),
        newDeliveryDate: joi_1.default.string().optional(),
        accepted: joi_1.default.boolean().optional(),
        cancelled: joi_1.default.boolean().optional()
    }).optional(),
    createdAt: joi_1.default.string().optional()
});
exports.messageSchema = messageSchema;
//# sourceMappingURL=message.schema.js.map