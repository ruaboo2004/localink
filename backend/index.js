require('./src/config/database');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.get('/', (req, res) => {
  res.send('Chào mừng đến với LocaLink API!');
});
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});