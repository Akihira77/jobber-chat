import j, { ObjectSchema } from "joi";

const messageSchema: ObjectSchema = j.object().keys({
    conversationId: j.string().optional().allow(null, ""),
    _id: j.string().optional(),
    body: j.string().optional().allow(null, ""),
    hasConversationId: j.boolean().optional(), // this is only for checking if conversation id exist
    file: j.string().optional().allow(null, ""),
    fileType: j.string().optional().allow(null, ""),
    fileName: j.string().optional().allow(null, ""),
    fileSize: j.string().optional().allow(null, ""),
    gigId: j.string().optional().allow(null, ""),
    sellerId: j.string().required().messages({
        "string.base": "Seller id is required",
        "string.empty": "Seller id is required",
        "any.required": "Seller id is required"
    }),
    buyerId: j.string().required().messages({
        "string.base": "Buyer id is required",
        "string.empty": "Buyer id is required",
        "any.required": "Buyer id is required"
    }),
    senderUsername: j.string().required().messages({
        "string.base": "Sender username is required",
        "string.empty": "Sender username is required",
        "any.required": "Sender username is required"
    }),
    senderPicture: j.string().required().messages({
        "string.base": "Sender picture is required",
        "string.empty": "Sender picture is required",
        "any.required": "Sender picture is required"
    }),
    receiverUsername: j.string().required().messages({
        "string.base": "Receiver username is required",
        "string.empty": "Receiver username is required",
        "any.required": "Receiver username is required"
    }),
    receiverPicture: j.string().required().messages({
        "string.base": "Receiver picture is required",
        "string.empty": "Receiver picture is required",
        "any.required": "Receiver picture is required"
    }),
    isRead: j.boolean().optional(),
    hasOffer: j.boolean().optional(),
    offer: j
        .object({
            gigTitle: j.string().optional(),
            price: j.number().optional(),
            description: j.string().optional(),
            deliveryInDays: j.number().optional(),
            oldDeliveryDate: j.string().optional(),
            newDeliveryDate: j.string().optional(),
            accepted: j.boolean().optional(),
            cancelled: j.boolean().optional()
        })
        .optional(),
    createdAt: j.string().optional()
});

export { messageSchema };
