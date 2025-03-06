import express from "express";
import { requestLeave } from "../controllers/counsellor/applyLeave.controller";

const router = express.Router();

router.post("/", requestLeave);

export default router;
