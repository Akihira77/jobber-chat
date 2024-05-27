"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.socketIOChatObject = exports.chatChannel = void 0;
const http_1 = __importDefault(require("http"));
require("express-async-errors");
const compression_1 = __importDefault(require("compression"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jobber_shared_1 = require("@Akihira77/jobber-shared");
const config_1 = require("./config");
const express_1 = require("express");
const hpp_1 = __importDefault(require("hpp"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const elasticsearch_1 = require("./elasticsearch");
const routes_1 = require("./routes");
const connection_1 = require("./queues/connection");
const socket_io_1 = require("socket.io");
const morgan_1 = __importDefault(require("morgan"));
function start(app) {
    securityMiddleware(app);
    standardMiddleware(app);
    routesMiddleware(app);
    startQueues();
    startElasticSearch();
    chatErrorHandler(app);
    startServer(app);
}
exports.start = start;
function securityMiddleware(app) {
    app.set("trust proxy", 1);
    app.use((0, hpp_1.default)());
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: [`${config_1.API_GATEWAY_URL}`],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }));
    app.use((req, _res, next) => {
        if (req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_TOKEN);
            req.currentUser = payload;
        }
        next();
    });
}
function standardMiddleware(app) {
    app.use((0, compression_1.default)());
    app.use((0, express_1.json)({ limit: "200mb" }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: "200mb" }));
    app.use((0, morgan_1.default)("dev"));
}
function routesMiddleware(app) {
    (0, routes_1.appRoutes)(app);
}
function startQueues() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.chatChannel = (yield (0, connection_1.createConnection)());
    });
}
function startElasticSearch() {
    (0, elasticsearch_1.checkConnection)();
}
function chatErrorHandler(app) {
    app.use((error, _req, res, next) => {
        (0, config_1.logger)("server.ts - chatErrorHandler()").error(`ChatService ${error.comingFrom}:`, error);
        if (error instanceof jobber_shared_1.CustomError) {
            res.status(error.statusCode).json(error.serializeErrors());
        }
        next();
    });
}
function startServer(app) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const httpServer = new http_1.default.Server(app);
            exports.socketIOChatObject = yield createSocketIO(httpServer);
            startHttpServer(httpServer);
            exports.socketIOChatObject.on("connection", (socket) => {
                (0, config_1.logger)("server.ts - startServer()").info(`Socket receive a connection with id: ${socket.id}`);
            });
        }
        catch (error) {
            (0, config_1.logger)("server.ts - startServer()").error("ChatService startServer() method error:", error);
        }
    });
}
function createSocketIO(httpServer) {
    return __awaiter(this, void 0, void 0, function* () {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: ["*"],
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            }
        });
        (0, config_1.logger)("server.ts - createSocketIO()").info("ChatService Socket connected");
        return io;
    });
}
function startHttpServer(httpServer) {
    try {
        (0, config_1.logger)("server.ts - startHttpServer()").info(`ChatService has started with pid ${process.pid}`);
        httpServer.listen(Number(config_1.PORT), () => {
            (0, config_1.logger)("server.ts - startHttpServer()").info(`ChatService running on port ${config_1.PORT}`);
        });
    }
    catch (error) {
        (0, config_1.logger)("server.ts - startHttpServer()").error("ChatService startHttpServer() method error:", error);
    }
}
//# sourceMappingURL=server.js.map