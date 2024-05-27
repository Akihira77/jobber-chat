"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true,
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
    }
});
exports.ConversationModel = (0, mongoose_1.model)("Conversation", conversationSchema, "Conversation");
//# sourceMappingURL=conversation.model.js.map