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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const chatController = __importStar(require("../controllers/chat.controller"));
const router = express_1.default.Router();
function chatRoutes() {
    router.post("/", chatController.addMessage);
    router.put("/offer", chatController.updateOffer);
    router.put("/mark-as-read", chatController.markSingleMessageAsRead);
    router.put("/mark-multiple-as-read", chatController.markMessagesAsRead);
    router.get("/conversation/:senderUsername/:receiverUsername", chatController.findConversation);
    router.get("/conversations/:username", chatController.findConversationList);
    router.get("/:senderUsername/:receiverUsername", chatController.findMessages);
    router.get("/:conversationId", chatController.findUserMessages);
    return router;
}
exports.chatRoutes = chatRoutes;
//# sourceMappingURL=chat.route.js.map