const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту http://localhost:${PORT}`);
});
