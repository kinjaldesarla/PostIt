import express from'express';
import * as PostController from '../controllers/post.controller';
import { verifyjwt } from '../middlewares/Auth.middleware';
import { upload } from '../middlewares/Multer.middleware';

const router= express.Router();
router.use(verifyjwt)
router.route('/create-post').post(upload.array('post',3),PostController.createPost);
router.route('/update-caption/:postId').patch(PostController.updatePostCaption);
router.route('/delete-post/:postId').delete(PostController.deletePost);
router.route('/allpost').get(PostController.getAllPosts);
router.route('/toggle-like-post/:postId').patch(PostController.toggleLikePost);
router.route('/post/:postId').get(PostController.getSinglePost);

export default router;