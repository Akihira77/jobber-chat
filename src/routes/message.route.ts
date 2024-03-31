import express, { Router } from "express";
import * as create from "@chat/controllers/create";
import * as get from "@chat/controllers/get";
import * as update from "@chat/controllers/update";

const router = express.Router();

export function messageRoutes(): Router {
    router.post("/", create.message);

    router.put("/offer", update.offer);
    router.put("/mark-as-read", update.markSingleMessageAsRead);
    router.put("/mark-multiple-as-read", update.markMessagesAsRead);

    router.get(
        "/conversation/:senderUsername/:receiverUsername",
        get.conversation
    );
    router.get("/conversations/:username", get.conversationList);
    router.get("/:senderUsername/:receiverUsername", get.messages);
    router.get("/:conversationId", get.userMessages);

    return router;
}
