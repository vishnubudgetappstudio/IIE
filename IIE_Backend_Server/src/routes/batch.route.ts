import express from "express";
import { createNewBatch } from "../controllers/counsellor/batch.controller";
import { getAllBatchesListController } from "../controllers/counsellor/getAllBatchList.controller";
import { getBatchStudentsController } from "../controllers/counsellor/getBatchStudentsList.controller";
import { addStudentToBatchController } from "../controllers/counsellor/addStudentInBatch.controller";

const router = express.Router();

router.post("/create-new-batch", createNewBatch);
router.get('/all-batches', getAllBatchesListController);
router.get("/:batchId/students", getBatchStudentsController);
router.post("/add-student", addStudentToBatchController);

export default router;
