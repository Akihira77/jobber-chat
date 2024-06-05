import http from "http";

import jwt from "jsonwebtoken";
import {
    CustomError,
    IAuthPayload,
} from "@Akihira77/jobber-shared";
import { API_GATEWAY_URL, JWT_TOKEN, PORT } from "@chat/config";
import { ElasicSearchClient } from "@chat/elasticsearch";
import { appRoutes } from "@chat/routes";
import { Server, Socket } from "socket.io";
import { Logger } from "winston";
import { Context, Hono, Next } from "hono";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { timeout } from "hono/timeout";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { rateLimiter } from "hono-rate-limiter";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { StatusCode } from "hono/utils/http-status";
import { ServerType } from "@hono/node-server/dist/types";
import { serve } from "@hono/node-server";

import { ChatQueue } from "./queues/chat.queue";

export let socketIOChatObject: Server;
const LIMIT_TIMEOUT = 2 * 1000; // 2s

export async function start(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    const queue = await startQueues(logger);
    await startElasticSearch(logger);
    chatErrorHandler(app);
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app, queue, logger);
    startServer(app, logger);
}

function securityMiddleware(app: Hono): void {
    app.use(
        timeout(LIMIT_TIMEOUT, () => {
            return new HTTPException(StatusCodes.REQUEST_TIMEOUT, {
                message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
            });
        })
    );
    app.use(
        secureHeaders({ crossOriginEmbedderPolicy: true, xXssProtection: true })
    );
    app.use(csrf({ origin: [`${API_GATEWAY_URL}`] }));
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    );

    app.use(async (c: Context, next: Next) => {
        const authorization = c.req.header("authorization");
        if (authorization && authorization !== "") {
            const token = authorization.split(" ")[1];
            const payload = jwt.verify(token, JWT_TOKEN!) as IAuthPayload;
            c.set("currentUser", payload);
        }

        await next();
    });
}

function standardMiddleware(app: Hono): void {
    app.use(compress());
    app.use(
        bodyLimit({
            maxSize: 2 * 100 * 1000 * 1024, //200mb
            onError(c: Context) {
                return c.text(
                    "Your request is too big",
                    StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE
                );
            }
        })
    );

    const generateRandomNumber = (length: number): number => {
        return (
            Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) +
            Math.pow(10, length - 1)
        );
    };

    app.use(
        rateLimiter({
            windowMs: 1 * 60 * 1000, //60s
            limit: 10,
            standardHeaders: "draft-6",
            keyGenerator: () => generateRandomNumber(12).toString()
        })
    );
}

function routesMiddleware(
    app: Hono,
    queue: ChatQueue,
    logger: (moduleName: string) => Logger
): void {
    appRoutes(app, queue, logger);
}

async function startQueues(
    logger: (moduleName: string) => Logger
): Promise<ChatQueue> {
    const queue = new ChatQueue(null, logger);
    await queue.createConnection();
    return queue;
}

async function startElasticSearch(
    logger: (moduleName: string) => Logger
): Promise<void> {
    const elastic = new ElasicSearchClient(logger);
    await elastic.checkConnection();
}

function chatErrorHandler(app: Hono): void {
    app.notFound((c) => {
        return c.text("Route path is not found", StatusCodes.NOT_FOUND);
    });

    app.onError((err: Error, c: Context) => {
        if (err instanceof CustomError) {
            return c.json(
                err.serializeErrors(),
                (err.statusCode as StatusCode) ??
                    StatusCodes.INTERNAL_SERVER_ERROR
            );
        } else if (err instanceof HTTPException) {
            return err.getResponse();
        }

        return c.text(
            "Unexpected error occured. Please try again",
            StatusCodes.INTERNAL_SERVER_ERROR
        );
    });
}

async function startServer(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    try {
        const server = startHttpServer(app, logger);
        socketIOChatObject = await createSocketIO(
            server as http.Server,
            logger
        );

        socketIOChatObject.on("connection", (socket: Socket) => {
            logger("server.ts - startServer()").info(
                `Socket receive a connection with id: ${socket.id}`
            );
        });

        socketIOChatObject.engine.on("connection_error", (err) => {
            console.log(err.req); // the request object
            console.log(err.code); // the error code, for example 1
            console.log(err.message); // the error message, for example "Session ID unknown"
            console.log(err.context); // some additional error context
        });
    } catch (error) {
        logger("server.ts - startServer()").error(
            "ChatService startServer() method error:",
            error
        );
    }
}

async function createSocketIO(
    httpServer: http.Server,
    logger: (moduleName: string) => Logger
): Promise<Server> {
    const io: Server = new Server(httpServer, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    logger("server.ts - createSocketIO()").info("ChatService Socket connected");

    return io;
}

function startHttpServer(
    hono: Hono,
    logger: (moduleName: string) => Logger
): ServerType {
    try {
        logger("server.ts - startHttpServer()").info(
            `ChatService has started with pid ${process.pid}`
        );

        const server = serve(
            {
                fetch: hono.fetch,
                port: Number(PORT),
                createServer: http.createServer
            },
            (info) => {
                logger("server.ts - startHttpServer()").info(
                    `ChatService running on port ${info.port}`
                );
            }
        );

        return server;
    } catch (error) {
        logger("server.ts - startHttpServer()").error(
            "ChatService startHttpServer() method error:",
            error
        );

        process.exit(1);
    }
}
