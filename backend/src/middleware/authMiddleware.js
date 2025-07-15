const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  const token = req.get('x-auth-token'); 
  if (!token) {
    return res.status(401).json({ msg: 'Không có token, không thể xác thực.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token không hợp lệ.' });
  }
};