import crypto from "crypto";

import {
    BadRequestError,
    uploads,
    IMessageDocument,
    IConversationDocument
} from "@Akihira77/jobber-shared";
import { messageSchema } from "@chat/schemas/message.schema";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as chatService from "@chat/services/chat.service";

export async function addMessage(req: Request, res: Response): Promise<void> {
    const { error } = messageSchema.validate(req.body);

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Create message() method"
        );
    }

    let file: string = req.body.file;
    const randomBytes: Buffer = crypto.randomBytes(20);
    const randomCharacters: string = randomBytes.toString("hex");

    if (file) {
        const result =
            req.body.fileType === "zip"
                ? await uploads(file, `${randomCharacters}.zip`)
                : await uploads(file);

        if (!result?.public_id) {
            throw new BadRequestError(
                "File upload error. Try again",
                "Create message() method"
            );
        }

        file = result?.secure_url;
    }

    const messageData: IMessageDocument = {
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
        await chatService.createConversation(
            String(req.body.conversationId),
            messageData.senderUsername!,
            messageData.receiverUsername!
        );
    }

    await chatService.addMessage(req.body.receiverEmail, messageData);

    res.status(StatusCodes.OK).json({
        message: "Message added",
        conversationId: req.body.conversationId,
        messageData
    });
}

export async function findConversation(
    req: Request,
    res: Response
): Promise<void> {
    const { senderUsername, receiverUsername } = req.params;

    const conversations: IConversationDocument[] =
        await chatService.getConversation(senderUsername, receiverUsername);

    res.status(StatusCodes.OK).json({
        message: "Chat conversation",
        conversations
    });
}

export async function findMessages(req: Request, res: Response): Promise<void> {
    const { senderUsername, receiverUsername } = req.params;

    const messages: IMessageDocument[] = await chatService.getMessages(
        senderUsername,
        receiverUsername
    );

    res.status(StatusCodes.OK).json({
        message: "Chat messages",
        messages
    });
}

export async function findConversationList(
    req: Request,
    res: Response
): Promise<void> {
    const { username } = req.params;

    const conversations: IMessageDocument[] =
        await chatService.getUserConversationList(username);

    res.status(StatusCodes.OK).json({
        message: "Conversation list",
        conversations
    });
}

export async function findUserMessages(
    req: Request,
    res: Response
): Promise<void> {
    const { conversationId } = req.params;

    const messages: IMessageDocument[] =
        await chatService.getUserMessages(conversationId);

    res.status(StatusCodes.OK).json({
        message: "Chat messages",
        messages
    });
}

export async function updateOffer(req: Request, res: Response): Promise<void> {
    const { messageId, type } = req.body;

    const result = await chatService.updateOffer(messageId, type);

    res.status(StatusCodes.OK).json({
        message: "Message updated",
        singleMessage: result
    });
}

export async function markMessagesAsRead(
    req: Request,
    res: Response
): Promise<void> {
    const { messageId, senderUsername, receiverUsername } = req.body;

    await chatService.markMultipleMessagesAsRead(
        senderUsername,
        receiverUsername,
        messageId
    );

    res.status(StatusCodes.OK).json({
        message: "Messages marked as read"
    });
}

export async function markSingleMessageAsRead(
    req: Request,
    res: Response
): Promise<void> {
    const { messageId } = req.body;

    const result = await chatService.markMessageAsRead(messageId);

    res.status(StatusCodes.OK).json({
        message: "Message marked as read",
        singleMessage: result
    });
}
