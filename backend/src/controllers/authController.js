const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer'); 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  const { name, email, password, region, interests } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Vui lòng nhập đủ tên, email và mật khẩu.' });
  }

  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, region, interests, verification_token) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, region, interests, verificationToken]
    );
    const verificationLink = `http://localhost:3001/api/auth/verify?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"LocaLink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xác thực tài khoản LocaLink của bạn',
      html: `
        <p>Chào mừng bạn đến với LocaLink!</p>
        <p>Vui lòng nhấn vào liên kết bên dưới để xác thực tài khoản của bạn:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Liên kết sẽ hết hạn sau 1 giờ.</p>
      `,
    });

    res.status(201).json({ msg: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.' });

  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ msg: 'Email này đã được sử dụng.' });
    }
    res.status(500).send('Lỗi từ server');
  }
};

// --- Hàm mới để xác thực email ---
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Token xác thực không hợp lệ hoặc đã hết hạn.');
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);

        if (users.length === 0) {
            return res.status(400).send('Token xác thực không hợp lệ hoặc đã hết hạn.');
        }

        const user = users[0];
        await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
            [user.id]
        );

        res.send('Xác thực email thành công! Bây giờ bạn có thể đăng nhập.');

    } catch (error) {
        console.error(error);
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

    if (!user.is_verified) {
        return res.status(401).json({ msg: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email của bạn.' });
    }

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