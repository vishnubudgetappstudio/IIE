import express from "express";
import { uploadImageController, uploadSingleFileController } from "../../controllers/s3/uploadFiles.controller";

const router = express.Router();

// Upload **one image**
router.post("/upload-image", uploadImageController);

// Upload **multiple files**
router.post("/upload-files", uploadSingleFileController);

export default router;
