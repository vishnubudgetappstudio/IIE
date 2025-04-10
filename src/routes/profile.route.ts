import { Router } from "express";
import { getProfileDetailsController } from "../controllers/profile/get_profile_details.controller";
import { updateProfileDetailsController } from "../controllers/profile/update_profile_details.controller";


const router = Router();

router.get("/get", getProfileDetailsController); // get Profile route
router.post("/update", updateProfileDetailsController); // update Profile route

export default router;