const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password, region, interests } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Vui lòng nhập đủ tên, email và mật khẩu.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, region, interests) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, region, interests]
    );

    res.status(201).json({ msg: 'Đăng ký thành công!', userId: result.insertId });

  } catch (error) {
    console.error(error);
    // Bắt lỗi email trùng lặp
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ msg: 'Email này đã được sử dụng.' });
    }
    res.status(500).send('Lỗi từ server');
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Vui lòng nhập email và mật khẩu.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ msg: 'Email hoặc mật khẩu không đúng.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Email hoặc mật khẩu không đúng.' });
    }

    const payload = {
      user: {
        id: user.id
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).send('Lỗi từ server');
  }
};