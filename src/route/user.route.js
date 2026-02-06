import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {getAudio, getAudioById, getArtistAudios, getCurrentUser} from "../controller/users/user.controllers.js";
import { getAlbumsById, getPublishedAlbums } from "../controller/Album&Playlist/album.controllers.js";

const router = Router();
router.use(verifyJWT)

// route
router.route("/getCurrentUser").get(getCurrentUser);
router.route("/get-audio").get(getAudio);
router.route("/get-audioByID/:audioId").get(getAudioById);
router.route("/get-artistAudio/:artistId").get(getArtistAudios);
router.route("/get-albumById/:albumId").get(getAlbumsById);
router.route("/get-PublishedAlbums").get(getPublishedAlbums);

export default router
