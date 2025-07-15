const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', postController.getAllPosts); 
router.post('/', authMiddleware, postController.createPost);
router.post('/:id/like', authMiddleware, postController.likePost); 
router.get('/:id/comments', postController.getCommentsForPost); 
router.post('/:id/comments', authMiddleware, postController.addComment); 

module.exports = router;