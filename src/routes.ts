import { Application } from "express";
import { healthRoutes } from "@chat/routes/health.route";
import { messageRoutes } from "@chat/routes/message.route";
import { verifyGatewayRequest } from "@Akihira77/jobber-shared";

const BASE_PATH = "/api/v1/message";

export function appRoutes(app: Application): void {
    app.use("", healthRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, messageRoutes());
}
