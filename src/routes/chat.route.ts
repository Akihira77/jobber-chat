import express, { Router } from "express";
import * as chatController from "@chat/controllers/chat.controller";

const router = express.Router();

export function chatRoutes(): Router {
    router.post("/", chatController.addMessage);

    router.put("/offer", chatController.updateOffer);
    router.put("/mark-as-read", chatController.markSingleMessageAsRead);
    router.put("/mark-multiple-as-read", chatController.markMessagesAsRead);

    router.get(
        "/conversation/:senderUsername/:receiverUsername",
        chatController.findConversation
    );
    router.get("/conversations/:username", chatController.findConversationList);
    router.get("/:senderUsername/:receiverUsername", chatController.findMessages);
    router.get("/:conversationId", chatController.findUserMessages);

    return router;
}
