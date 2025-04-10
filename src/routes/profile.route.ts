import { Router } from "express";
import { getProfileDetailsController } from "../controllers/profile/get_profile_details.controller";
import { updateProfileDetailsController } from "../controllers/profile/update_profile_details.controller";
import { upload } from "../middlewares/upload.middleware";


const router = Router();

router.get("/get", getProfileDetailsController); // get Profile route
router.post("/update", upload.single("image"), updateProfileDetailsController); // update Profile route

export default router;