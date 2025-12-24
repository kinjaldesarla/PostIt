import express from 'express';
import * as CommentController from '../controllers/comment.controller';
import { verifyjwt } from '../middlewares/Auth.middleware';

const router=express.Router();

router.use(verifyjwt);
router.route('/add-comment/:postId').post(CommentController.addComment);
router.route('/delete-comment/:commentId').delete(CommentController.deleteComment)
router.route('/toggle-like-comment/:commentId').patch(CommentController.toggleLikeComment);

export default router;