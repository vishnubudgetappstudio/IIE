import { Router } from "express";
import { getProfileController, updateProfileController } from "../controllers/profile.controller";


const router = Router();

router.get("/get", getProfileController); // get Profile route
router.post("/update", updateProfileController); // update Profile route

export default router;