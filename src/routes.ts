import { Application } from "express";
import { healthRoutes } from "@chat/routes/health.route";
import { chatRoutes } from "@chat/routes/chat.route";

const BASE_PATH = "/api/v1/message";

export function appRoutes(app: Application): void {
    app.use("", healthRoutes());
    app.use(BASE_PATH, chatRoutes());
}
