import verifyJWT from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import {
    uploadAudio, deleteAudioById, updateAudioDetails,togglePublishStatus 
} from "../controller/users/artist.controllers.js";
import { Router } from "express";

const router = Router();

// apply all routes
router.use(verifyJWT) 
router.use(authorize("artist"));

// route
router.route("/upload-audio").post(
    upload.single("audio"),
    uploadAudio
)

router.route("/delete-audio/:audioId").delete(deleteAudioById);
router.route("/update-audio/:audioId").patch(updateAudioDetails);
router.route("/toggle-status/:audioId").patch(togglePublishStatus);

export default router
