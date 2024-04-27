import http from "http";
import "express-async-errors";

import compression from "compression";
import jwt from "jsonwebtoken";
import {
    CustomError,
    IAuthPayload,
    IErrorResponse,
    winstonLogger
} from "@Akihira77/jobber-shared";
import { Logger } from "winston";
import {
    API_GATEWAY_URL,
    ELASTIC_SEARCH_URL,
    JWT_TOKEN,
    PORT
} from "@chat/config";
import {
    Application,
    NextFunction,
    Request,
    Response,
    json,
    urlencoded
} from "express";
import hpp from "hpp";
import helmet from "helmet";
import cors from "cors";
import { checkConnection } from "@chat/elasticsearch";
import { appRoutes } from "@chat/routes";
import { createConnection } from "@chat/queues/connection";
import { Channel } from "amqplib";
import { Server } from "socket.io";

const log: Logger = winstonLogger(
    `${ELASTIC_SEARCH_URL}`,
    "chatServer",
    "debug"
);
export let chatChannel: Channel;
export let socketIOChatObject: Server;

export function start(app: Application): void {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    chatErrorHandler(app);
    startServer(app);
}

function securityMiddleware(app: Application): void {
    app.set("trust proxy", 1);
    app.use(hpp());
    app.use(helmet());
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    );

    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const payload = jwt.verify(token, JWT_TOKEN!) as IAuthPayload;

            req.currentUser = payload;
        }
        next();
    });
}

function standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: "200mb" }));
    app.use(urlencoded({ extended: true, limit: "200mb" }));
}

function routesMiddleware(app: Application): void {
    appRoutes(app);
}

async function startQueues(): Promise<void> {
    chatChannel = (await createConnection()) as Channel;
}

function startElasticSearch(): void {
    checkConnection();
}

function chatErrorHandler(app: Application): void {
    app.use(
        (
            error: IErrorResponse,
            _req: Request,
            res: Response,
            next: NextFunction
        ) => {
            log.error(`ChatService ${error.comingFrom}:`, error);

            if (error instanceof CustomError) {
                res.status(error.statusCode).json(error.serializeErrors());
            }
            next();
        }
    );
}

async function startServer(app: Application): Promise<void> {
    try {
        const httpServer: http.Server = new http.Server(app);
        socketIOChatObject = await createSocketIO(httpServer);

        startHttpServer(httpServer);
    } catch (error) {
        log.error("ChatService startServer() method error:", error);
    }
}

async function createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        }
    });

    log.info("ChatService Socket connected");

    return io;
}

function startHttpServer(httpServer: http.Server): void {
    try {
        log.info(`Chat server has started with pid ${process.pid}`);

        httpServer.listen(Number(PORT), () => {
            log.info(`Chat server running on port ${PORT}`);
        });
    } catch (error) {
        log.error("ChatService startHttpServer() method error:", error);
    }
}
