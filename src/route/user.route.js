import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {getAudio, getAudioById, getArtistAudios} from "../controller/users/user.controllers.js";

const router = Router();
router.use(verifyJWT)

// route
router.route("/get-audio").get(getAudio);
router.route("/get-audioByID/:audioId").get(getAudioById);
router.route("/get-artistAudio/:artistId").get(getArtistAudios);

export default router
