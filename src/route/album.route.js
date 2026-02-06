import verifyJWT from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { Router } from "express";
import { 
    createAlbum, addAudioToAlbum, deleteAlbum,
    deleteAudioToAlbum, updateAlbum, publishAlbumToggle
} from "../controller/Album&Playlist/album.controllers.js";

const router = Router();

// apply all routes
router.use(verifyJWT) 
router.use(authorize("artist", "admin"));

// routes
router.route("/create")
.post(
    upload.single("coverImage"),
    createAlbum
)

router.route("/add/:albumId/audio/:audioId").post(addAudioToAlbum);
router.route("/update/:albumId").patch(updateAlbum);
router.patch("/publish/:albumId").patch(publishAlbumToggle);

router.route("/delete/:albumId/audio/:audioId").delete(deleteAudioToAlbum);
router.route("/delete/:albumId").delete(deleteAlbum);

export default router
