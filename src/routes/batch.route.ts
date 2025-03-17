import express from "express";
import {
    addStudentsToBatchController,
    createNewBatch,
    getAllBatchesListController,
    getBatchStudentsController,
    removeStudentsFromBatchController
} from "../controllers/counsellor/batch.controller";

const router = express.Router();

router.post("/create-new-batch", createNewBatch);
router.get('/all-batches', getAllBatchesListController);
router.get("/students", getBatchStudentsController);
router.post("/add-students", addStudentsToBatchController);
router.post("/remove-students", removeStudentsFromBatchController);

export default router;
