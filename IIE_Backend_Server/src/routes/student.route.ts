import express from "express";
import { createNewStudentController } from "../controllers/counsellor/createStudent.controller";

const router = express.Router();

router.post("/", createNewStudentController);

export default router;
