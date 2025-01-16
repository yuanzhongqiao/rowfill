import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";


export class Logger {
    private static _instance: Logger | null = null;
    private _logtail: Logtail;
    private _logger: winston.Logger;

    constructor() {
        this._logtail = new Logtail(process.env.BETTER_STACK_TOKEN || "")

        const transports = process.env.LOGTAIL !== "" ? new LogtailTransport(this._logtail) : new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })

        // process .env is PROD then logtail else commandline
        this._logger = winston.createLogger({
            transports: [transports],
        })
    }

    public static getInstance(): winston.Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger()
        }
        return Logger._instance._logger
    }
}

export const logger = Logger.getInstance()
