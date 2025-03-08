import express from "express";
import { addStudentsToBatchController, createNewBatch, removeStudentsFromBatchController } from "../controllers/counsellor/batch.controller";
import { getAllBatchesListController } from "../controllers/counsellor/getAllBatchList.controller";
import { getBatchStudentsController } from "../controllers/counsellor/getBatchStudentsList.controller";

const router = express.Router();

router.post("/create-new-batch", createNewBatch);
router.get('/all-batches', getAllBatchesListController);
router.get("/students", getBatchStudentsController);
router.post("/add-students", addStudentsToBatchController);
router.post("/remove-students", removeStudentsFromBatchController);

export default router;
