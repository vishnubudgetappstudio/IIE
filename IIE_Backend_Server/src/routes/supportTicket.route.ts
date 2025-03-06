import express from "express";
import { raiseSupportTicket } from "../controllers/counsellor/supportTicket.controller";

const router = express.Router();

router.post("/", raiseSupportTicket);

export default router;
