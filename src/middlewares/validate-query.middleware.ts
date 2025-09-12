import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app.error";

export const validateQuery = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance<object, any>(dtoClass, req.query as object, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const message = errors
        .map((error) => Object.values(error.constraints || {}))
        .join(", ");
      throw new AppError(message, 400);
    }

    next();
  };
};
