const pool = require('../config/database');

exports.getAllPosts = async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.created_at, 
        u.name AS author_name, 
        u.avatar AS author_avatar
      FROM 
        posts p
      JOIN 
        users u ON p.user_id = u.id
      ORDER BY 
        p.created_at DESC` 
    );
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};

exports.createPost = async (req, res) => {
  const { content, image_url } = req.body;
  const user_id = req.user.id; 

  if (!content && !image_url) {
    return res.status(400).json({ msg: 'Bài viết phải có nội dung hoặc hình ảnh.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [user_id, content, image_url]
    );
    const [newPost] = await pool.query(
      `SELECT 
        p.*, 
        u.name AS author_name, 
        u.avatar AS author_avatar
       FROM posts p JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};
exports.likePost = async (req, res) => {
  const user_id = req.user.id;
  const post_id = req.params.id;

  try {
    const [existingLike] = await pool.query(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [user_id, post_id]
    );

    if (existingLike.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [user_id, post_id]);
      res.json({ msg: 'Đã bỏ thích bài viết.' });
    } else {
      await pool.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [user_id, post_id]);
      res.json({ msg: 'Đã thích bài viết.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};

exports.addComment = async (req, res) => {
  const { content } = req.body;
  const user_id = req.user.id;
  const post_id = req.params.id;

  if (!content) {
    return res.status(400).json({ msg: 'Nội dung bình luận không được để trống.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post_id, user_id, content]
    );
    const [newComment] = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar as author_avatar 
       FROM comments c JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};

exports.getCommentsForPost = async (req, res) => {
  const post_id = req.params.id;
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar as author_avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [post_id]
    );
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};