const fs = require('fs');
const path = require('path');

class GridGenerator {
  constructor() {
    this.directions = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 }
    ];
    this.alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    
    this.wordsData = JSON.parse(
        fs.readFileSync('words.json', 'utf8')
      );
  }

  generateGrid(level) {
    const sizes = { 1: 10, 2: 15, 3: 20 };
    const size = sizes[level] || 10;
    const words = this.wordsData[level.toString()] || this.wordsData["1"];
    
    const grid = Array(size).fill().map(() => Array(size).fill(' '));
    const placedWords = [];

    for (const word of words) {
      if (!this.placeWord(grid, word, placedWords, size)) {
        console.warn(`Не удалось разместить слово: ${word}`);
      }
    }

    this.fillEmptyCells(grid, size);

    return {
      level,
      gridSize: size,
      grid,
      words: placedWords
    };
  }

  placeWord(grid, word, placedWords, size) {
    const attempts = 50;
    
    for (let attempt = 0; attempt < attempts; attempt++) {
      const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
      const maxX = direction.x > 0 ? size - word.length : 
                  direction.x < 0 ? word.length - 1 : size - 1;
      const maxY = direction.y > 0 ? size - word.length : 
                  direction.y < 0 ? word.length - 1 : size - 1;

      if (maxX < 0 || maxY < 0) continue;

      const startX = Math.floor(Math.random() * (maxX + 1));
      const startY = Math.floor(Math.random() * (maxY + 1));

      if (this.canPlaceWord(grid, word, startX, startY, direction, size)) {
        this.putWord(grid, word, startX, startY, direction);
        
        const endX = startX + direction.x * (word.length - 1);
        const endY = startY + direction.y * (word.length - 1);
        
        placedWords.push({
          word: word,
          start: [startY, startX],
          end: [endY, endX],
          found: false
        });
        
        return true;
      }
    }
    
    return false;
  }

  canPlaceWord(grid, word, startX, startY, direction, size) {
    let x = startX;
    let y = startY;

    for (let i = 0; i < word.length; i++) {
      if (x < 0 || x >= size || y < 0 || y >= size) {
        return false;
      }

      if (grid[y][x] !== ' ' && grid[y][x] !== word[i]) {
        return false;
      }

      x += direction.x;
      y += direction.y;
    }

    return true;
  }

  putWord(grid, word, startX, startY, direction) {
    let x = startX;
    let y = startY;

    for (let i = 0; i < word.length; i++) {
      grid[y][x] = word[i];
      x += direction.x;
      y += direction.y;
    }
  }

  fillEmptyCells(grid, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] === ' ') {
          grid[y][x] = this.alphabet[Math.floor(Math.random() * this.alphabet.length)];
        }
      }
    }
  }
}

module.exports = GridGenerator;