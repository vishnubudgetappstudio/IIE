import express from "express";
import {
    addStudentsToBatchController,
    createNewBatch,
    getAllBatchesListController,
    getBatchStudentsController,
    getSessionSheetDataController,
    removeStudentsFromBatchController
} from "../controllers/counsellorModule/batch.controller";

const router = express.Router();

router.post("/create-new-batch", createNewBatch);
router.get('/all-batches', getAllBatchesListController);
router.get("/students", getBatchStudentsController);
router.post("/add-students", addStudentsToBatchController);
router.post("/remove-students", removeStudentsFromBatchController);

// ✅ Route to fetch and parse session sheet data
router.get("/session-sheet", getSessionSheetDataController);

export default router;
