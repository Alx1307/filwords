const express = require('express');
const cors = require('cors');
const GridGenerator = require('./gridGenerator');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const gridGenerator = new GridGenerator();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Сервис генерации сетки слов',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/generate', (req, res) => {
  try {
    const level = parseInt(req.query.level) || 1;
    
    if (level < 1 || level > 3) {
      return res.status(400).json({
        error: 'Некорректный уровень. уровень должен быть 1, 2 или 3'
      });
    }

    const gridData = gridGenerator.generateGrid(level);
    
    res.json({
      success: true,
      data: gridData
    });
  } catch (error) {
    console.error('Ошибка генерации сетки:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.get('/api/levels', (req, res) => {
  try {
    const levels = [
      { 
        id: 1, 
        name: 'Легкий', 
        gridSize: 10, 
        wordCount: gridGenerator.wordsData["1"].length,
        words: gridGenerator.wordsData["1"]
      },
      { 
        id: 2, 
        name: 'Средний', 
        gridSize: 15, 
        wordCount: gridGenerator.wordsData["2"].length,
        words: gridGenerator.wordsData["2"]
      },
      { 
        id: 3, 
        name: 'Сложный', 
        gridSize: 20, 
        wordCount: gridGenerator.wordsData["3"].length,
        words: gridGenerator.wordsData["3"]
      }
    ];

    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Ошибка получения уровней:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

app.listen(port, () => {
  console.log(`Сервер генератора слов запущен на порту http://localhost:${port}`);
});