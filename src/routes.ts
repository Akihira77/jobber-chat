import { Logger } from "winston";
import jwt from "jsonwebtoken";
import { Context, Hono, Next } from "hono";
import { StatusCodes } from "http-status-codes";
import { NotAuthorizedError } from "@Akihira77/jobber-shared";

import { ChatQueue } from "./queues/chat.queue";
import { ChatService } from "./services/chat.service";
import { ChatHandler } from "./handler/chat.handler";
import { GATEWAY_JWT_TOKEN } from "./config";

const BASE_PATH = "/api/v1/message";

export function appRoutes(
    app: Hono,
    queue: ChatQueue,
    logger: (moduleName: string) => Logger
): void {
    app.get("chat-health", (c: Context) => {
        return c.text("Chat service is healthy and OK.", StatusCodes.OK);
    });

    const chatSvc = new ChatService(logger, queue);
    const chatController = new ChatHandler(chatSvc);

    const api = app.basePath(BASE_PATH);
    api.use(verifyGatewayRequest);

    chatRoute(api, chatController);
}

function chatRoute(
    api: Hono<Record<string, never>, Record<string, never>, typeof BASE_PATH>,
    chatHndlr: ChatHandler
): void {
    api.post("/", async (c: Context) => {
        const jsonBody = await c.req.json();
        const messageData =
            await chatHndlr.addMessage.bind(chatHndlr)(jsonBody);

        return c.json(
            {
                message: "Message added",
                conversationId: jsonBody.conversationId,
                messageData
            },
            StatusCodes.OK
        );
    });

    api.put("/offer", async (c: Context) => {
        const { messageId, type } = await c.req.json();
        const message = await chatHndlr.updateOffer.bind(chatHndlr)(
            messageId,
            type
        );

        return c.json(
            {
                message: "Message updated",
                singleMessage: message
            },
            StatusCodes.OK
        );
    });

    api.put("/mark-as-read", async (c: Context) => {
        const { messageId } = await c.req.json();
        const message =
            await chatHndlr.markSingleMessageAsRead.bind(chatHndlr)(messageId);

        return c.json(
            {
                message: "Message marked as read",
                singleMessage: message
            },
            StatusCodes.OK
        );
    });

    api.put("/mark-multiple-as-read", async (c: Context) => {
        const { messageId, senderUsername, receiverUsername } =
            await c.req.json();
        await chatHndlr.markMessagesAsRead.bind(chatHndlr)(
            messageId,
            senderUsername,
            receiverUsername
        );

        return c.json(
            {
                message: "Messages marked as read"
            },
            StatusCodes.OK
        );
    });

    api.get(
        "/conversation/:senderUsername/:receiverUsername",
        async (c: Context) => {
            const { senderUsername, receiverUsername } = c.req.param();
            const conversations = await chatHndlr.findConversation.bind(
                chatHndlr
            )(senderUsername, receiverUsername);

            return c.json(
                {
                    message: "Chat conversation",
                    conversations
                },
                StatusCodes.OK
            );
        }
    );
    api.get("/conversations/:username", async (c: Context) => {
        const username = c.req.param("username");
        const conversations =
            await chatHndlr.findConversationList.bind(chatHndlr)(username);

        return c.json(
            {
                message: "Conversation list",
                conversations
            },
            StatusCodes.OK
        );
    });
    api.get("/:senderUsername/:receiverUsername", async (c: Context) => {
        const { senderUsername, receiverUsername } = c.req.param();
        const messages = await chatHndlr.findMessages.bind(chatHndlr)(
            senderUsername,
            receiverUsername
        );

        return c.json(
            {
                message: "Chat messages",
                messages
            },
            StatusCodes.OK
        );
    });
    api.get("/:conversationId", async (c: Context) => {
        const conversationId = c.req.param("conversationId");
        const messages =
            await chatHndlr.findUserMessages.bind(chatHndlr)(conversationId);

        return c.json(
            {
                message: "Chat messages",
                messages
            },
            StatusCodes.OK
        );
    });
}

async function verifyGatewayRequest(c: Context, next: Next): Promise<void> {
    const token = c.req.header("gatewayToken");
    if (!token) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        );
    }

    try {
        const payload: { id: string; iat: number } = jwt.verify(
            token,
            GATEWAY_JWT_TOKEN!
        ) as {
            id: string;
            iat: number;
        };

        c.set("gatewayToken", payload);
        await next();
    } catch (error) {
        throw new NotAuthorizedError(
            "Invalid request",
            "verifyGatewayRequest() method: Request not coming from api gateway"
        );
    }
}
