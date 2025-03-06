import express from "express";
import { getStaff_Student_BatchController } from "../controllers/counsellor/getStaff_Student_Batch.controller";

const router = express.Router();

router.get("/", getStaff_Student_BatchController);

export default router;
