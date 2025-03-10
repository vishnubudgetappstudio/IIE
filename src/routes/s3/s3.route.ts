import express from "express";
import { upload } from "../../middlewares/upload.middleware";
import { uploadFilesController, uploadImageController } from "../../controllers/s3/uploadFiles.controller";

const router = express.Router();

// Upload **one image**
router.post("/upload-image", upload.single("image"), uploadImageController);

// Upload **multiple files**
router.post("/upload-files", upload.array("files", 5), uploadFilesController);

export default router;
