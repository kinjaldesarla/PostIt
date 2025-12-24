import express from 'express';
import * as UserController from '../controllers/user.controller';
import { verifyjwt } from '../middlewares/Auth.middleware';
import { upload } from '../middlewares/Multer.middleware';

const router=express.Router();

router.route('/signup').post(UserController.registerUser);
router.route('/login').post(UserController.loginUser);
router.route('/logout').get(verifyjwt,UserController.logoutUser);
router.route('/edit-profile').patch(verifyjwt,upload.single('profilePhoto'),UserController.editUserProfile);
router.route('/change-password').patch(verifyjwt,UserController.changePassword);
router.route('/follow-user-request/:searchUserId').patch(verifyjwt,UserController.followUser);
router.route('/accept-request/:requestId').patch(verifyjwt,UserController.acceptRequest);
router.route('/profile').get(verifyjwt,UserController.getUserProfile);
router.route('/search').get(verifyjwt,UserController.searchUsers);
router.route('/search-user/:searchUserId').get(verifyjwt,UserController.getSearchUserProfile);
router.route('/profile-follower-following/:userId').get(verifyjwt,UserController.getFollowersFollowing);
router.route('/remove-follower/:followerId').patch(verifyjwt,UserController.removeFollower);
router.route('/unfollow-user/:followingId').patch(verifyjwt,UserController.unfollowUser);
router.route('/notifications').get(verifyjwt,UserController.getNotifications)
router.route('/notifications/:searchUserId').get(verifyjwt,UserController.getSearchUserNotifications)
router.route('/delete-notification/:notificationId').delete(verifyjwt,UserController.removeNotification)
export default router;