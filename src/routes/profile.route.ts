import express from "express";
import { getProfile } from "../controllers/counsellor/profile.controller";

const router = express.Router();

router.get("/", getProfile);

export default router;
