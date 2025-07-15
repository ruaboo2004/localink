const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

// === Routes cho Bài viết ===
router.get('/', postController.getAllPosts); // Lấy tất cả bài viết (Công khai)
router.post('/', authMiddleware, postController.createPost); // Tạo bài viết (Bảo vệ)

// === Routes cho Tương tác ===
// Thích/Bỏ thích bài viết (Bảo vệ)
router.post('/:id/like', authMiddleware, postController.likePost); 

// Lấy bình luận của bài viết (Công khai)
router.get('/:id/comments', postController.getCommentsForPost); 

// Thêm bình luận mới (Bảo vệ)
router.post('/:id/comments', authMiddleware, postController.addComment); 

module.exports = router;