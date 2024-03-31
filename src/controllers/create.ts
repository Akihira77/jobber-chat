import {
    BadRequestError,
    IMessageDocument,
    uploads
} from "@Akihira77/jobber-shared";
import { messageSchema } from "@chat/schemas/message.schema";
import { Request, Response } from "express";
import crypto from "crypto";
import { addMessage, createConversation } from "@chat/services/message.service";
import { StatusCodes } from "http-status-codes";

export async function message(req: Request, res: Response): Promise<void> {
    const { error } = await Promise.resolve(messageSchema.validate(req.body));

    if (error?.details) {
        throw new BadRequestError(
            error.details[0].message,
            "Create message() method"
        );
    }

    let file: string = req.body.file;
    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString("hex");

    if (file) {
        const result =
            req.body.fileType === "zip"
                ? await uploads(file, `${randomCharacters}.zip`)
                : await uploads(file);

        if (!result?.public_id) {
            throw new BadRequestError(
                "File uplaod error. Try again",
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
        await createConversation(
            String(req.body.conversationId),
            messageData.senderUsername!,
            messageData.receiverUsername!
        );
    }

    await addMessage(messageData);

    res.status(StatusCodes.OK).json({
        message: "Message added",
        conversationId: req.body.conversationId,
        messageData
    });
}
