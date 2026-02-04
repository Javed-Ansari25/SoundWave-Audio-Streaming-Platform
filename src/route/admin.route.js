import verifyJWT from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { 
    getAdminDashboard, getAllUsersForAdmin, getAllAudioForAdmin, adminDeleteAudio, adminUpdateAudio, toggleAudioStatus
} from "../controller/admin/admin.controllers.js";

import { Router } from "express";
const router = Router();

router.use(verifyJWT) 
router.use(authorize("admin"));

// routes
router.route("/dashboard").get(getAdminDashboard);
router.route("/audios").get(getAllAudioForAdmin);
router.route("/users").get(getAllUsersForAdmin);
router.route("/audio/delete/:audioId").delete(adminDeleteAudio);
router.route("/audio/update/:audioId").patch(adminUpdateAudio);
router.route("/audio/:audioId/toggle-status").patch(toggleAudioStatus);

export default router
