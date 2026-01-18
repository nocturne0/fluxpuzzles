// ===== CONFIGURATION =====
const INITIAL_GRID_SIZE = 3;
const INITIAL_PATH_LENGTH = 6;
const DEBUG_MODE = false; // Set to true to show path controls for testing

// Custom dictionary file - set the path to your .txt file (one word per line)
// Leave as null to use the built-in test dictionary
const CUSTOM_DICTIONARY_FILE = null; // Example: 'my_words.txt' or 'https://example.com/words.txt'

// Letter distribution - probability for each letter
// Values must be between 0 and 1, and sum to 1.0
const LETTER_PROBABILITIES = {
    A: 0.082, B: 0.015, C: 0.028, D: 0.043, E: 0.127, F: 0.022, 
    G: 0.020, H: 0.061, I: 0.070, J: 0.002, K: 0.008, L: 0.040, 
    M: 0.024, N: 0.067, O: 0.075, P: 0.019, Q: 0.001, R: 0.060, 
    S: 0.063, T: 0.091, U: 0.028, V: 0.010, W: 0.024, X: 0.002, 
    Y: 0.020, Z: 0.001
};
// Sum: 1.000 (based on English letter frequency)

// Test dictionary (200 words)
const dictionary_ = [
    'CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'DEER',
    'APPLE', 'GRAPE', 'MELON', 'PEACH', 'LEMON', 'MANGO', 'BERRY',
    'HOUSE', 'MOUSE', 'HORSE', 'SNAKE', 'TIGER', 'EAGLE', 'WHALE',
    'WATER', 'PLANT', 'STONE', 'RIVER', 'OCEAN', 'CLOUD', 'STORM',
    'BOOK', 'TREE', 'LEAF', 'SEED', 'ROOT', 'STAR', 'MOON', 'SUN',
    'TABLE', 'CHAIR', 'LIGHT', 'MUSIC', 'DANCE', 'PARTY', 'DREAM',
    'PIZZA', 'BREAD', 'CHEESE', 'BACON', 'HONEY', 'SUGAR', 'CREAM',
    'HAPPY', 'SMILE', 'LAUGH', 'PEACE', 'TRUST', 'GRACE', 'BRAVE',
    'MAGIC', 'QUEST', 'POWER', 'SWIFT', 'BRIGHT', 'GRAND', 'SWEET',
    'GIANT', 'QUICK', 'SHARP', 'CLEAR', 'FRESH', 'CLEAN', 'ROYAL',
    'BEACH', 'CORAL', 'PEARL', 'SHELL', 'SANDY', 'WAVES', 'COAST',
    'FLAME', 'BLAZE', 'SPARK', 'SMOKE', 'EMBER', 'GLOW', 'SHINE',
    'FROST', 'CHILL', 'WINTER', 'SPRING', 'SUMMER', 'AUTUMN', 'SEASON',
    'GARDEN', 'FLOWER', 'PETAL', 'BLOOM', 'BLOSSOM', 'MEADOW', 'FIELD',
    'CASTLE', 'TOWER', 'THRONE', 'CROWN', 'SWORD', 'SHIELD', 'ARMOR',
    'DRAGON', 'WIZARD', 'KNIGHT', 'PRINCE', 'PRINCESS', 'KINGDOM', 'EMPIRE',
    'FOREST', 'JUNGLE', 'DESERT', 'MOUNTAIN', 'VALLEY', 'CANYON', 'PLAINS',
    'PIRATE', 'SAILOR', 'CAPTAIN', 'TREASURE', 'COMPASS', 'ANCHOR', 'VOYAGE',
    'GUITAR', 'PIANO', 'VIOLIN', 'TRUMPET', 'MELODY', 'HARMONY', 'RHYTHM',
    'SOCCER', 'TENNIS', 'HOCKEY', 'RACING', 'SWIMMING', 'RUNNING', 'JUMPING',
    'PURPLE', 'ORANGE', 'YELLOW', 'SILVER', 'GOLDEN', 'BRONZE', 'VIOLET',
    'PLANET', 'COMET', 'GALAXY', 'NEBULA', 'METEOR', 'COSMOS', 'STELLAR',
    'ROCKET', 'SPACE', 'ORBIT', 'LAUNCH', 'MISSION', 'EXPLORE', 'DISCOVER',
    'CODING', 'LAPTOP', 'TABLET', 'SCREEN', 'BUTTON', 'CURSOR', 'MEMORY',
    'PUZZLE', 'RIDDLE', 'CLUE', 'SECRET', 'MYSTERY', 'CIPHER', 'ENIGMA'
];
var sizes = {
    2: {
        4: 1
    }
    3: {
        7: 5,
        8: 3,
        9: 2
    },
    4: {
        11: 10,
        12: 15,
        13: 10,
        14: 8,
        15: 5,
        16: 3
    },
    5: {
        12: 10,
        13: 30,
        14: 50,
        15: 80,
        16: 100,
        17: 80,
        18: 60,
        19: 50,
        20: 30,
        21: 20,
        22: 15,
        23: 10,
        24: 8,
        25: 5
    },
    6: {
        16: 10,
        17: 20,
        18: 30,
        19: 50,
        20: 100,
        21: 120,
        22: 110,
        23: 100,
        24: 80,
        25: 60,
        27: 40,
        28: 30,
        29: 25,
        30: 20
    }
}

var dictionaries = [[]]
for(let k=1;k<32;k++) {
    if(k == 26 || k == 30) {
        dictionaries.push([])
        console.log(k)
        continue
    }
    else {
        let dict_ = [];
        fetch(String(k)+'.txt')
          .then(response => {
              if (!response.ok) {
                  throw new Error("Could not load words.txt");
              }
              return response.text();
          })
          .then(text => {
              // Split by newlines and remove empty lines
              dict_ = text.split(/\r?\n/).filter(Boolean);
              console.log(dict_); // see the words in the console
              dictionaries.push(dict_)
          })
          .catch(error => {
              console.error("Error loading dictionary:", error);
          });
    }
}
alert('dictionaries done loading')
// ===== END CONFIGURATION =====

// Generate a random letter based on probability distribution
function randomlength(boardSize) {
    const weights = sizes[boardSize];
    if (!weights) {
        throw new Error("Invalid board size");
    }

    // Convert object into entries
    const entries = Object.entries(weights); // [[length, weight], ...]

    // Sum all weights
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

    // Pick random number between 0 and totalWeight
    let rand = Math.random() * totalWeight;

    // Find which bucket it falls into
    for (const [length, weight] of entries) {
        rand -= weight;
        if (rand <= 0) {
            return Number(length);
        }
    }
}

function getRandomLetter() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [letter, probability] of Object.entries(LETTER_PROBABILITIES)) {
        cumulative += probability;
        if (rand <= cumulative) {
            return letter;
        }
    }
    
    // Fallback (shouldn't happen if probabilities sum to 1)
    return 'E';
}

// Keep this for backward compatibility with any code that might use it
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const letters = ALPHABET; // Alias for any old code

var grid_size = INITIAL_GRID_SIZE;
var pathlength = INITIAL_PATH_LENGTH
let currentPath = null;
let pathVisible = false;
let dictionary = new Set();
let dictionaryLoaded = false;
let gridLetters = []; // Store current grid letters

// User selection state
let isSelecting = false;
let userPath = [];
let userWord = '';
let streak = 0;
let targetWord = ''; // Store the hidden word
let successfulWords = []; // Track successful words

// Initialize with test dictionary
dictionary = new Set(dictionary_);
dictionaryLoaded = true;
console.log(`Test dictionary loaded: ${dictionary.size} words`);

// ===== MAIN GRID GENERATION FUNCTION =====
// This function creates a new grid with random letters and a hidden word
function generateGrid() {
    // gridSize = parseInt(document.getElementById('gridSize').value) || gridsize;
    const gridSize = grid_size
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Calculate font size based on grid size
    const baseFontSize = Math.max(1.5, 3.5 - (gridSize * 0.25));
    
    gridLetters = [];
    
    // First, fill grid with random letters
    for (let i = 0; i < gridSize * gridSize; i++) {
        const letter = getRandomLetter();
        gridLetters.push(letter);
    }
    
    // Then generate a path and place a word on it
    if (dictionaryLoaded) {
        // const pathLength = parseInt(document.getElementById('pathLength').value) || pathlength;
        // const pathLength = pathlength
        const pathLength = randomlength(gridSize)
        console.log(pathLength)
        currentPath = generateRandomPath(pathLength);
        if (currentPath) {
            const word = getRandomWordOfLength(pathLength);
            if (word) {
                targetWord = word; // Store the target word
                // Place the word on the path in gridLetters
                for (let i = 0; i < currentPath.length; i++) {
                    const pos = currentPath[i];
                    const cellIndex = pos.row * gridSize + pos.col;
                    gridLetters[cellIndex] = word[i];
                }
                // Update target length display
                const targetLengthDisplay = document.getElementById('targetLength');
                if (targetLengthDisplay) {
                    targetLengthDisplay.textContent = word.length;
                }
                console.log('Grid generated with hidden word:', word);
            }
        }
    }
    
    // Now create the cells with the final letters
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.fontSize = `${baseFontSize}em`;
        cell.dataset.index = i;
        cell.textContent = gridLetters[i];
        
        // Add mouse event listeners for selection
        cell.addEventListener('mousedown', startSelection);
        cell.addEventListener('mouseenter', continueSelection);
        cell.addEventListener('mouseup', endSelection);
        
        grid.appendChild(cell);
    }
    
    // Clear path state when generating new grid
    pathVisible = false;
    const button = document.querySelector('button[onclick="togglePath()"]');
    if (button) button.textContent = 'Show Path';
}
// ===== END MAIN GRID GENERATION =====

function startSelection(e) {
    e.preventDefault();
    console.log('Start selection');
    isSelecting = true;
    userPath = [];
    userWord = '';
    
    const index = parseInt(e.target.dataset.index);
    const row = Math.floor(index / grid_size);
    const col = index % grid_size;
    
    userPath.push({ row, col, index });
    userWord += gridLetters[index];
    
    console.log('Started with:', userWord);
    updateUserSelection();
}

function continueSelection(e) {
    if (!isSelecting) return;
    
    console.log('Continue selection');
    const index = parseInt(e.target.dataset.index);
    
    // Check if already selected
    if (userPath.some(p => p.index === index)) {
        console.log('Already selected');
        return;
    }
    
    // Check if adjacent to last selected cell
    if (userPath.length > 0) {
        const row = Math.floor(index / grid_size);
        const col = index % grid_size;
        
        // Check if adjacent to ANY of the last 3 cells in the path
        let isAdjacentToRecent = false;
        const checkCount = Math.min(3, userPath.length);
        const recentCell = userPath[userPath.length - 1];
        const rowDiff = Math.abs(row - recentCell.row);
        const colDiff = Math.abs(col - recentCell.col);
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
          isAdjacentToRecent = true;
        }
        for (let i = 1; i < checkCount; i++) {
            const recentCell = userPath[userPath.length - 1 - i];
            const rowDiff = Math.abs(row - recentCell.row);
            const colDiff = Math.abs(col - recentCell.col);
            
            if ((rowDiff + colDiff) == 0) {
                isAdjacentToRecent = false;
                console.log('aaa',rowDiff,colDiff)
                break;
            }
        }
        console.log(isAdjacentToRecent)
        if (isAdjacentToRecent) {
            userPath.push({ row, col, index });
            userWord += gridLetters[index];
            console.log('Added letter:', gridLetters[index], 'Word:', userWord);
            updateUserSelection();
        } else {
            console.log('Not adjacent to recent cells');
        }
    }
}

function endSelection(e) {
    console.log('End selection');
    if (!isSelecting) return;
    isSelecting = false;
    
    // Process the word
    if (userWord.length > 0) {
        console.log('Word entered:', userWord);
        checkWord(userWord);
    }
    
    // Clear selection
    setTimeout(() => {
        clearUserSelection();
    }, 200);
}

function checkWord(word) {
    const resultMsg = document.getElementById('resultMessage');
    
    console.log('Checking word:', word, 'Target:', targetWord, 'In dictionary:', dictionary.has(word));
    
    // Check if it's the target word
    if (word === targetWord) {
        // Success!
        streak++;
        updateStreak();
        successfulWords.push({ word: word, type: 'perfect' });
        updateWordHistory();
        resultMsg.textContent = '✓ Perfect! ' + word;
        resultMsg.className = 'success';
        flashSuccess();
        setTimeout(() => {
            generateGrid();
            resultMsg.textContent = '';
            resultMsg.className = '';
        }, 1500);
    } 
    // Check if it's a valid bonus word (same length or longer, in dictionary)
    else if (word.length >= targetWord.length && dictionary.has(word)) {
        // Bonus!
        streak++;
        updateStreak();
        successfulWords.push({ word: word, type: 'bonus' });
        updateWordHistory();
        resultMsg.textContent = '⭐ BONUS! ' + word + ' (length: ' + word.length + ')';
        resultMsg.className = 'bonus';
        flashSuccess();
        setTimeout(() => {
            generateGrid();
            resultMsg.textContent = '';
            resultMsg.className = '';
        }, 1500);
    }
    // Invalid word
    else {
        // Failure - show why
        let reason = '';
        if (word.length < targetWord.length) {
            reason = ' (too short)';
        } else if (!dictionary.has(word)) {
            reason = ' (not in dictionary)';
        }
        streak = 0;
        updateStreak();
        resultMsg.textContent = '✗ Try again' + reason;
        resultMsg.className = 'failure';
        setTimeout(() => {
            resultMsg.textContent = '';
            resultMsg.className = '';
        }, 1500);
    }
}

function updateWordHistory() {
    const historyDiv = document.getElementById('wordHistory');
    historyDiv.innerHTML = '';
    
    // Show most recent 20 words (no limit since it's in a scrollable sidebar)
    const recentWords = successfulWords.slice().reverse();
    
    if (recentWords.length === 0) {
        historyDiv.innerHTML = '<span style="color: #999; font-style: italic; font-size: 0.9em;">No words yet...</span>';
        return;
    }
    
    recentWords.forEach(item => {
        const badge = document.createElement('div');
        badge.textContent = item.word;
        badge.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9em;
            text-align: center;
            ${item.type === 'perfect' 
                ? 'background: #4CAF50; color: white;' 
                : 'background: #FF9800; color: white;'}
        `;
        historyDiv.appendChild(badge);
    });
}

function updateStreak() {
    document.getElementById('streakCounter').textContent = streak;
}

function flashSuccess() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.add('success-flash');
        setTimeout(() => cell.classList.remove('success-flash'), 600);
    });
}

function updateUserSelection() {
    // Don't clear, just add to selection
    const cells = document.querySelectorAll('.cell');
    
    // Clear all first
    cells.forEach(cell => {
        cell.classList.remove('selected', 'user-path-number');
        cell.removeAttribute('data-user-path-num');
    });
    
    // Then apply current selection
    userPath.forEach((pos, index) => {
        const cell = cells[pos.index];
        console.log('Highlighting cell', pos.index, cell);
        cell.classList.add('selected', 'user-path-number');
        cell.setAttribute('data-user-path-num', index + 1);
    });
    
    // Update word display
    const wordDisplay = document.getElementById('currentWord');
    if (wordDisplay) {
        wordDisplay.textContent = userWord || '';
    }
}

function clearUserSelection() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('selected', 'user-path-number');
        cell.removeAttribute('data-user-path-num');
    });
    
    userPath = [];
    userWord = '';
    
    const wordDisplay = document.getElementById('currentWord');
    wordDisplay.textContent = '';
}

// Prevent text selection while dragging
document.addEventListener('mouseup', () => {
    if (isSelecting) {
        isSelecting = false;
    }
});

function getRandomWordOfLength(l) {
    if (!dictionaryLoaded) {
        console.warn('Dictionary not loaded yet');
        return null;
    }
    if (l == 26 || l == 30) {
        console.warn(`No words found with length ${l}`);
        return null;
    }
    
    
    return dictionaries[l][Math.floor(Math.random() * dictionaries[l].length)];
}

function placeWordOnPath(word, path) {
    if (!word || !path || word.length !== path.length) return;
    
    const cells = document.querySelectorAll('.cell');
    
    for (let i = 0; i < path.length; i++) {
        const pos = path[i];
        const cellIndex = pos.row * gridSize + pos.col;
        const cell = cells[cellIndex];
        cell.textContent = word[i];
        gridLetters[cellIndex] = word[i];
    }
}

function generateNewPath() {
    if (!dictionaryLoaded) {
        alert('Dictionary is still loading, please wait...');
        return;
    }
    
    // Clear the old path first
    clearPath();
    
    const pathLength = parseInt(document.getElementById('pathLength').value) || 5;
    currentPath = generateRandomPath(pathLength);
    
    if (currentPath) {
        const word = getRandomWordOfLength(pathLength);
        if (word) {
            targetWord = word; // Store the new target word
            placeWordOnPath(word, currentPath);
            // Update target length display
            const targetLengthDisplay = document.getElementById('targetLength');
            if (targetLengthDisplay) {
                targetLengthDisplay.textContent = word.length;
            }
            // Don't show the path automatically
            pathVisible = false;
            const button = document.querySelector('button[onclick="togglePath()"]');
            if (button) button.textContent = 'Show Path';
        } else {
            alert(`Couldn't find a word with ${pathLength} letters`);
        }
    }
}

function togglePath() {
    console.log('togglePath called, pathVisible:', pathVisible, 'currentPath:', currentPath);
    pathVisible = !pathVisible;
    const button = event.target;
    
    if (pathVisible) {
        // Just show the existing path, don't generate a new one
        console.log('Showing path...');
        button.textContent = 'Hide Path';
        highlightPath();
    } else {
        console.log('Hiding path...');
        button.textContent = 'Show Path';
        clearPath();
    }
}

function highlightPath() {
    console.log('highlightPath called, currentPath:', currentPath);
    if (!currentPath) {
        console.log('No current path to highlight!');
        return;
    }
    
    const cells = document.querySelectorAll('.cell');
    console.log('Total cells:', cells.length);
    currentPath.forEach((pos, index) => {
        const cellIndex = pos.row * gridSize + pos.col;
        const cell = cells[cellIndex];
        console.log('Highlighting cell index:', cellIndex, 'Letter:', cell.textContent);
        cell.classList.add('highlighted', 'path-number');
        cell.setAttribute('data-path-num', index + 1);
    });
}

function clearPath() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('highlighted', 'path-number');
        cell.removeAttribute('data-path-num');
    });
}

function generateRandomPath(length) {
    if (length > grid_size * grid_size) {
        console.error('Path length cannot exceed total grid cells');
        return null;
    }

    const path = [];
    const visited = new Set();
    
    // Start at a random position
    let row = Math.floor(Math.random() * grid_size);
    let col = Math.floor(Math.random() * grid_size);
    
    path.push({row, col});
    visited.add(`${row},${col}`);
    
    // All 8 directions: N, NE, E, SE, S, SW, W, NW
    const directions = [
        [-1, 0], [-1, 1], [0, 1], [1, 1],
        [1, 0], [1, -1], [0, -1], [-1, -1]
    ];
    
    while (path.length < length) {
        const current = path[path.length - 1];
        const validMoves = [];
        
        // Check all 8 directions
        for (const [dr, dc] of directions) {
            const newRow = current.row + dr;
            const newCol = current.col + dc;
            const key = `${newRow},${newCol}`;
            
            // Check if move is valid (in bounds and not visited)
            if (newRow >= 0 && newRow < grid_size && 
                newCol >= 0 && newCol < grid_size && 
                !visited.has(key)) {
                validMoves.push({row: newRow, col: newCol});
            }
        }
        
        // If no valid moves, backtrack or restart
        if (validMoves.length === 0) {
            // Simple strategy: start over
            return generateRandomPath(length);
        }
        
        // Choose a random valid move
        const nextMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        path.push(nextMove);
        visited.add(`${nextMove.row},${nextMove.col}`);
    }
    
    return path;
}

generateGrid();

function skipWord() {
  // Reset streak
  streak = 0;
  updateStreak();

  // Show skip message
  const resultMsg = document.getElementById('resultMessage');
  resultMsg.textContent = `⏭️ Skipped - The word was: ${targetWord}`;
  resultMsg.className = 'failure';

  // Generate new grid after brief delay
  setTimeout(() => {
    generateGrid();
    resultMsg.textContent = '';
    resultMsg.className = '';
  }, 1000);
}
