import http from "http"
import { createVerifier } from "fast-jwt"
import {
    CustomError,
    IAuthPayload,
    winstonLogger
} from "@Akihira77/jobber-shared"
import {
    API_GATEWAY_URL,
    ELASTIC_SEARCH_URL,
    JWT_TOKEN,
    NODE_ENV,
    PORT
} from "@chat/config"
import { Context, Hono, Next } from "hono"
import { cors } from "hono/cors"
import { compress } from "hono/compress"
import { timeout } from "hono/timeout"
import { csrf } from "hono/csrf"
import { secureHeaders } from "hono/secure-headers"
import { bodyLimit } from "hono/body-limit"
import { HTTPException } from "hono/http-exception"
import { appRoutes } from "@chat/routes"
import { Logger } from "winston"
import { StatusCodes } from "http-status-codes"
import { StatusCode } from "hono/utils/http-status"
import { serve } from "@hono/node-server"
import { logger } from "hono/logger"
import { ChatQueue } from "./queues/chat.queue"
import { ElasticSearchClient } from "./elasticsearch"
import { DisconnectReason, Server, Socket } from "socket.io"
import { App } from "uWebSockets.js"
import { ServerType } from "@hono/node-server/dist/types"
import { Channel } from "amqplib"

const LIMIT_TIMEOUT = 3 * 1000 // 3s
export let socketIOChatObject: Server
export let pubMQChatObject: ChatQueue
export let consumeMQChatObject: ChatQueue

export async function setupHono(
    app: Hono,
    logger?: (location?: string) => Logger
): Promise<Hono> {
    if (!logger) {
        logger = (location?: string) =>
            winstonLogger(
                `${ELASTIC_SEARCH_URL}`,
                location ?? "server.ts",
                "debug"
            )
    }

    const { queue, ch } = await startQueues(logger)
    await startElasticSearch(logger)
    chatErrorHandler(app)
    securityMiddleware(app)
    standardMiddleware(app)
    routesMiddleware(app, queue, ch, logger)

    return app
}

export async function start(
    app: Hono,
    logger: (moduleName?: string) => Logger
): Promise<void> {
    app = await setupHono(app, logger)
    startServer(app, logger)
}

function securityMiddleware(app: Hono): void {
    app.use(
        timeout(LIMIT_TIMEOUT, () => {
            return new HTTPException(StatusCodes.REQUEST_TIMEOUT, {
                message: `Request timeout after waiting ${LIMIT_TIMEOUT}ms. Please try again later.`
            })
        })
    )
    app.use(
        secureHeaders({
            xXssProtection: "1"
        })
    )
    app.use(csrf({ origin: [`${API_GATEWAY_URL}`] }))
    app.use(
        cors({
            origin: [`${API_GATEWAY_URL}`],
            credentials: true,
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        })
    )

    app.use(async (c: Context, next: Next) => {
        const authorization = c.req.header("authorization")
        if (authorization && authorization !== "") {
            const authBearer = authorization.split(" ")[1]
            const verifier = createVerifier({
                key: `${JWT_TOKEN}`,
                cache: true,
                cacheTTL: 30 * 60 * 1000
            })
            const payload = verifier(authBearer) as IAuthPayload
            c.set("currentUser", payload)
        }

        await next()
    })
}

function standardMiddleware(app: Hono): void {
    if (NODE_ENV !== "production") {
        app.use(logger())
    }
    app.use(compress())
    app.use(
        bodyLimit({
            maxSize: 2 * 100 * 1000 * 1024, //200mb
            onError(c: Context) {
                return c.text(
                    "Your request is too big",
                    StatusCodes.REQUEST_HEADER_FIELDS_TOO_LARGE
                )
            }
        })
    )

    //    app.use(
    //        rateLimiter({
    //            windowMs: 10 * 60 * 1000, // 600s
    //            limit: 100,
    //            standardHeaders: "draft-6",
    //            keyGenerator: (c: Context) => {
    //                return c.req.url
    //            }
    //        })
    //    )
}

function routesMiddleware(
    app: Hono,
    queue: ChatQueue,
    ch: Channel,
    logger: (moduleName: string) => Logger
): void {
    appRoutes(app, queue, ch, logger)
}

async function startQueues(
    logger: (moduleName: string) => Logger
): Promise<{ queue: ChatQueue; ch: Channel }> {
    const queue = new ChatQueue(logger)
    const pub = await queue.createConnection()
    const pubCh = await pub.createChannel()

    pubMQChatObject = queue
    consumeMQChatObject = queue

    return { queue, ch: pubCh }
}

export async function startElasticSearch(
    logger: (moduleName: string) => Logger
): Promise<ElasticSearchClient> {
    const elastic = new ElasticSearchClient(logger)
    await elastic.checkConnection()

    return elastic
}

function chatErrorHandler(app: Hono): void {
    app.notFound((c) => {
        return c.text("Route path does not found", StatusCodes.NOT_FOUND)
    })

    app.onError((err: Error, c: Context) => {
        if (err instanceof CustomError) {
            console.log(err)
            return c.json(
                err.serializeErrors(),
                (err.statusCode as StatusCode) ??
                    StatusCodes.INTERNAL_SERVER_ERROR
            )
        } else if (err instanceof HTTPException) {
            return err.getResponse()
        }

        return c.text(
            "Unexpected error occured. Please try again",
            StatusCodes.INTERNAL_SERVER_ERROR
        )
    })
}

async function startServer(
    app: Hono,
    logger: (moduleName: string) => Logger
): Promise<void> {
    try {
        startHttpServer(app, logger)
        socketIOChatObject = await createSocketIO(logger)

        socketIOChatObject.on("connection", (socket: Socket) => {
            logger("server.ts - startServer()").info(
                `Socket receive a connection with id: ${socket.id}`
            )

            socket.on("disconnect", (reason: DisconnectReason) => {
                logger("server.ts - startServer()").info(
                    `Socket with id: ${socket.id} disconnected with reason: ${reason.toString()}`
                )
            })
        })
    } catch (error) {
        logger("server.ts - startServer()").error(
            "ChatService startServer() method error:",
            error
        )
    }
}
async function createSocketIO(
    logger: (moduleName: string) => Logger
): Promise<Server> {
    const uwsApp = App()
    const io: Server = new Server({
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true
        },
        transports: ["websocket"]
    })

    io.attachApp(uwsApp)
    // console.log("OrderService Socket connected");
    logger("server.ts - createSocketIO()").info("ChatService Socket connected")

    io.engine.on("connection", (rawSocket) => {
        rawSocket.request = null
    })

    uwsApp.listen(Number(PORT) - 1000, (token) => {
        if (!token) {
            logger("server.ts - createSocketIO()").warn(
                "Port is already in use"
            )
        } else {
            logger("server.ts - createSocketIO()").info(
                `SocketIO x uWebSockets.js is running on port ${Number(PORT) - 1000}`
            )
        }
    })
    return io
}

function startHttpServer(
    hono: Hono,
    logger: (moduleName: string) => Logger
): ServerType {
    try {
        logger("server.ts - startHttpServer()").info(
            `ChatService has started with pid ${process.pid}`
        )

        const server = serve(
            {
                fetch: hono.fetch,
                port: Number(PORT),
                createServer: http.createServer
            },
            (info) => {
                logger("server.ts - startHttpServer()").info(
                    `ChatService running on port ${info.port}`
                )
            }
        )

        return server
    } catch (error) {
        logger("server.ts - startHttpServer()").error(
            "ChatService startHttpServer() method error:",
            error
        )

        process.exit(1)
    }
}
