import multer from "multer";

export class UploaderMiddleware {
  upload = (fileSize: number = 1) => {
    const storage = multer.memoryStorage();

    const limits = { fileSize: fileSize * 1024 * 1024 };

    return multer({ storage, limits });
  };
}
