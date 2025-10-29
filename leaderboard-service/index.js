const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const readResults = () => {
  try {
    const data = fs.readFileSync('results.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Ошибка при чтении файла с результатами:', error);
    return [];
  }
};

const writeResults = (results) => {
  try {
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
    return true;
  } catch (error) {
    console.error('Ошибка при записи результатов в файл:', error);
    return false;
  }
};

const generateId = () => {
  const results = readResults();
  const maxId = results.reduce((max, result) => Math.max(max, result.id), 0);
  return maxId + 1;
};

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Сервис игрового рейтинга',
    timestamp: new Date().toISOString(),
    totalResults: readResults().length
  });
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { playerName, level, time } = req.body;

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Имя игрока обязательно'
      });
    }

    if (![1, 2, 3].includes(parseInt(level))) {
      return res.status(400).json({
        success: false,
        error: 'Уровень должен быть 1, 2 или 3'
      });
    }

    if (typeof time !== 'number' || time < 0) {
      return res.status(400).json({
        success: false,
        error: 'Время должно быть положительным числом'
      });
    }

    const results = readResults();
    
    const newResult = {
      id: generateId(),
      playerName: playerName.trim(),
      level: parseInt(level),
      time: parseInt(time)
    };

    results.push(newResult);

    if (writeResults(results)) {
      res.status(201).json({
        success: true,
        data: newResult
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Не удалось сохранить результат'
      });
    }

  } catch (error) {
    console.error('Ошибка сохранения результата:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const level = req.query.level ? parseInt(req.query.level) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (level && (level < 1 || level > 3)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный уровень. уровень должен быть 1, 2 или 3'
      });
    }

    let results = readResults();

    if (level) {
      results = results.filter(result => result.level === level);
    }

    results.sort((a, b) => a.time - b.time);

    if (limit) {
      results = results.slice(0, limit);
    }

    res.json({
      success: true,
      data: results,
      total: results.length,
      level: level || 'Все'
    });

  } catch (error) {
    console.error('Ошибка загрузки игрового рейтинга:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.get('/api/leaderboard/top', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const results = readResults();

    const topResults = {
      1: results.filter(result => result.level === 1)
               .sort((a, b) => a.time - b.time)
               .slice(0, limit),
      2: results.filter(result => result.level === 2)
               .sort((a, b) => a.time - b.time)
               .slice(0, limit),
      3: results.filter(result => result.level === 3)
               .sort((a, b) => a.time - b.time)
               .slice(0, limit)
    };

    res.json({
      success: true,
      data: topResults
    });

  } catch (error) {
    console.error('Ошибка загрузки лучших результатов:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.get('/api/leaderboard/stats', (req, res) => {
  try {
    const level = req.query.level ? parseInt(req.query.level) : null;
    let results = readResults();

    if (level) {
      results = results.filter(result => result.level === level);
    }

    const stats = {
      totalResults: results.length,
      bestTime: results.length > 0 ? Math.min(...results.map(r => r.time)) : null,
      averageTime: results.length > 0 ? 
        Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length) : null,
      level: level || 'Все'
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    res.status(500).json({ 
      success: false,
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

app.get('/api/leaderboard/player/:name', (req, res) => {
    try {
      const searchName = req.params.name.toLowerCase().trim();
      const results = readResults();
  
      const playerResults = results.filter(result => 
        result.playerName.toLowerCase() === searchName
      );
  
      if (playerResults.length === 0) {
        const allPlayerNames = [...new Set(results.map(r => r.playerName))];
        const similarNames = allPlayerNames.filter(name => 
          name.toLowerCase().includes(searchName)
        ).slice(0, 5);
  
        return res.status(404).json({
          success: false,
          error: `Игрок с именем '${req.params.name}' не найден`,
          message: 'Проверьте правильность написания имени'
        });
      }
  
      playerResults.sort((a, b) => a.time - b.time);
  
      res.json({
        success: true,
        data: playerResults,
        total: playerResults.length,
        playerName: playerResults[0].playerName
      });
  
    } catch (error) {
      console.error('Ошибка загрузки результатов игрока:', error);
      res.status(500).json({ 
        success: false,
        error: 'Внутренняя ошибка сервера' 
      });
    }
});

app.listen(port, () => {
  console.log(`Сервер рейтинга игроков запущен на порту http://localhost:${port}`);
});