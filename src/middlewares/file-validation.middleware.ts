import { Request, Response, NextFunction } from "express";

export function fileValidationMiddleware(
  allowedMimeTypes: string[] = ["image/jpeg", "image/png", "image/jpg"],
  maxSizeInMB: number = 2 // default 2MB
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;

    if (!file) {
      // kalau field file opsional, langsung next
      return next();
    }

    // cek mimetype
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
      });
    }

    next();
  };
}
