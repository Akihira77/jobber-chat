import {
    IConversationDocument,
    IMessageDocument
} from "@Akihira77/jobber-shared";
import {
    getConversation,
    getMessages,
    getUserConversationList,
    getUserMessages
} from "@chat/services/message.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function conversation(req: Request, res: Response): Promise<void> {
    const { senderUsername, receieverUsername } = req.params;

    const conversations: IConversationDocument[] = await getConversation(
        senderUsername,
        receieverUsername
    );

    res.status(StatusCodes.OK).json({
        message: "Chat conversation",
        conversations
    });
}

export async function messages(req: Request, res: Response): Promise<void> {
    const { senderUsername, receieverUsername } = req.params;

    const messages: IMessageDocument[] = await getMessages(
        senderUsername,
        receieverUsername
    );

    res.status(StatusCodes.OK).json({
        message: "Chat messages",
        messages
    });
}

export async function conversationList(
    req: Request,
    res: Response
): Promise<void> {
    const { username } = req.params;

    const conversations: IMessageDocument[] =
        await getUserConversationList(username);

    res.status(StatusCodes.OK).json({
        message: "Conversation list",
        conversations
    });
}

export async function userMessages(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params;

    const messages: IMessageDocument[] = await getUserMessages(conversationId);

    res.status(StatusCodes.OK).json({
        message: "Chat messages",
        messages
    });
}
