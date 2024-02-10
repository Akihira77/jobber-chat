import {
    markMessageAsRead,
    markMultipleMessagesAsRead,
    updateOffer
} from "@chat/services/message.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export async function offer(req: Request, res: Response): Promise<void> {
    const { messageId, type } = req.body;

    const result = await updateOffer(messageId, type);

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

    await markMultipleMessagesAsRead(
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

    const result = await markMessageAsRead(messageId);

    res.status(StatusCodes.OK).json({
        message: "Message marked as read",
        singleMessage: result
    });
}
