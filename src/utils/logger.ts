import fs from "fs";
import path from "path";
import { createLogger, format, transports, Logger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = format;

const isServerless = !!process.env.VERCEL;

const logDir = process.env.LOG_DIR || path.join(process.cwd(), "logs");

const logFormat = printf(({ timestamp, level, message, stack, ...rest }) => {
  const meta = rest.meta ? JSON.stringify(rest.meta, null, 2) : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${
    stack ? `\nStack: ${stack}` : ""
  } ${meta}`;
});

export class LoggerService {
  private logger: Logger;

  constructor() {
    const transportList: any[] = [
      new transports.Console({
        format: combine(
          colorize(),
          printf(({ level, message, stack }) =>
            `${level}: ${
              typeof message === "string" ? message : JSON.stringify(message)
            }${stack ? `\n${stack}` : ""}`
          )
        ),
      }),
    ];

    if (!isServerless) {
      fs.mkdirSync(logDir, { recursive: true });

      transportList.push(
        new transports.File({
          filename: path.join(logDir, "error.log"),
          level: "error",
          format: logFormat,
        }),
        new transports.File({
          filename: path.join(logDir, "warn.log"),
          level: "warn",
          format: logFormat,
        }),
        new transports.File({
          filename: path.join(logDir, "combined.log"),
          format: logFormat,
        }),
        new DailyRotateFile({
          filename: path.join(logDir, "%DATE%-app.log"),
          datePattern: "YYYY-MM-DD",
          zippedArchive: true,
          maxSize: "20m",
          maxFiles: "14d",
          format: logFormat,
        })
      );
    }

    this.logger = createLogger({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true })
      ),
      transports: transportList,
    });
  }

  public error(message: string, meta?: unknown) { this.logger.error({ message, meta }); }
  public warn(message: string, meta?: unknown)  { this.logger.warn({ message, meta }); }
  public info(message: string, meta?: unknown)  { this.logger.info({ message, meta }); }
  public http(message: string, meta?: unknown)  { this.logger.http({ message, meta }); }
  public debug(message: string, meta?: unknown) { this.logger.debug({ message, meta }); }
}