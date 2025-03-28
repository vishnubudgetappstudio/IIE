import express from "express";
import { createNewBatchController } from "../controllers/counsellorModule/batch_related/create_new_batch.controller";
import { getAllBatchesListController } from "../controllers/counsellorModule/batch_related/get_all_batches_list.controller";
import { addStudentsToBatchController } from "../controllers/counsellorModule/batch_related/add_students_to_batch.controller";
import { removeStudentsFromBatchController } from "../controllers/counsellorModule/batch_related/remove_students_from_batch.controller";
import { getAllStudentsFromBatchController } from "../controllers/counsellorModule/batch_related/get_all_students_from_batch.controller";
import { getSessionSheetDataController } from "../controllers/counsellorModule/batch_related/get_session_sheet_data.controller";

const router = express.Router();

router.post("/create-new-batch", createNewBatchController);
router.get('/all-batches', getAllBatchesListController);
router.get("/students", getAllStudentsFromBatchController);
router.post("/add-students", addStudentsToBatchController);
router.post("/remove-students", removeStudentsFromBatchController);

// ✅ Route to fetch and parse session sheet data
router.get("/session-sheet", getSessionSheetDataController);

export default router;
