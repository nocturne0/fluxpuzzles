// ===== CONFIGURATION =====
const INITIAL_GRID_SIZE = 4;
const DEBUG_MODE = false; // Set to true to show path controls for testing
var dict_used = 1 // 0 -> DWYL, 1 -> CSW
var dictmap = {
    0:'DWYL',
    1:'CSW'
}

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

var sizes1 = {
    2: {
        4: 1
    },
    3: {
        7: 5,
        8: 3,
        9: 2
    },
    4: {
        10: 8,
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
        31: 20
    }
}
var sizes2 = {
    2: {
        4: 1
    },
    3: {
        7: 5,
        8: 3,
        9: 2
    },
    4: {
        10: 8,
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
        21: 20
    },
    6: {
        16: 10,
        17: 20,
        18: 30,
        19: 50,
        20: 100,
        21: 120
    }
}
var sizelist = [sizes1,sizes2]
document.getElementById("wordInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // optional: stops form submission
        checkWord(document.getElementById("wordInput").value.toUpperCase())
        document.getElementById("wordInput").value = "";
    }
});

var dictionaries = []
dictionaries.length = 32;
var dictionaryLoaded = false;

// Dictionary selection
function selectDictionary(dict) {
    if(dict_used == dict) {
        return
    }
    dict_used = dict
    dictionaries = []
    dictionaries.length = 32;
    dictionaryLoaded = false;

    // Update button states
    const buttons = document.querySelectorAll('.dict-button');
    buttons.forEach(btn => {
        if (btn.textContent === dictmap[dict]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const loadPromises = [];
    let kmax = 32
    if(dict_used == 1) {
        kmax = 22
    }
    for (let k = 0; k < kmax; k++) {
        if (k === 0 || k === 26 || k === 30) {
            dictionaries[k] = [];
            continue;
        } 
        if (k == 1 && dict_used == 1) {
            dictionaries[k] = [];
            continue;
        }
        else {
            let path_ = String(k) + ".txt"
            if(dict_used == 1) {
                path_ = String(k) + "CSW.txt"
            }
            console.log(path_)
            loadPromises.push(
                fetch(path_)
                    .then(r => {
                        if (!r.ok) throw new Error(`Failed to load ${k}.txt`);
                        return r.text();
                    })
                    .then(text => {
                        dictionaries[k] = text.split(/\r?\n/).filter(Boolean);
                    })
                );
            }
        }
        Promise.all(loadPromises).then(() => {
            console.log("✅ All dictionaries loaded");
            dictionaryLoaded = true;
            generateGrid();
        });
            
            // TODO: Load the selected dictionary
            // For now, just log the selection
}

selectDictionary(dict_used)

// ===== END CONFIGURATION =====

// Generate a random letter based on probability distribution
function randomlength(boardSize) {
    const weights = sizelist[dict_used][boardSize];
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
let currentPath = null;
let pathVisible = false;
let dictionary = new Set();
var gridLetters = []; // Store current grid letters

// User selection state
let isSelecting = false;
let userPath = [];
let userWord = '';
let streak = 0;
var targetWord = ''; // Store the hidden word
var successfulWords = []; // Track successful words
var skippedWords = [];
var isProcessing = false;

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
        // console.log(pathLength,'letters long')
        currentPath = generateRandomPath(pathLength);
        if (currentPath) {
            const word = getRandomWordOfLength(pathLength).toUpperCase();
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
        // cell.addEventListener('mouseleave', (e) => {
        // // End selection if we leave the grid area
        // // Check if the relatedTarget is null (left the document) or not a cell
        // if (isSelecting) {
        //     const target = e.relatedTarget;
        //     if (!target || !target.classList || !target.classList.contains('cell')) {
        //         endSelection(e);
        //     }
        // }
        // });
        grid.appendChild(cell);
    }
    
    // Clear path state when generating new grid
    pathVisible = false;
    const button = document.querySelector('button[onclick="togglePath()"]');
    if (button) button.textContent = 'Show Path';
}


// ===== END MAIN GRID GENERATION =====

function selectSize(size_used) {
    grid_size = size_used
    generateGrid()
}

function startSelection(e) {
    e.preventDefault();
    // console.log('Start selection');
    isSelecting = true;
    userPath = [];
    userWord = '';
    
    const index = parseInt(e.target.dataset.index);
    const row = Math.floor(index / grid_size);
    const col = index % grid_size;
    
    userPath.push({ row, col, index });
    userWord += gridLetters[index];
    
    // console.log('Started with:', userWord);
    updateUserSelection();
}

function continueSelection(e) {
    if (!isSelecting) return;
    
    // console.log('Continue selection');
    const index = parseInt(e.target.dataset.index);
    
    // Check if already selected
    if (userPath.some(p => p.index === index)) {
        // console.log('Already selected');
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
                break;
            }
        }
        // console.log(isAdjacentToRecent)
        if (isAdjacentToRecent) {
            userPath.push({ row, col, index });
            userWord += gridLetters[index];
            // console.log('Added letter:', gridLetters[index], 'Word:', userWord);
            updateUserSelection();
        } else {
            // console.log('Not adjacent to recent cells');
        }
    }
}

function endSelection(e) {
    // console.log('End selection');
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

function isWordOnBoard(word) {
    word = word.toUpperCase();
    
    if (word.length === 0) return false;
    
    // Find all starting positions with the first letter
    const startPositions = [];
    for (let i = 0; i < gridLetters.length; i++) {
        if (gridLetters[i] === word[0]) {
            const col = Math.floor(i / grid_size);
            const row = i % grid_size;
            startPositions.push({row, col, index: i});
        }
    }
    
    // Try to find the word starting from each position
    for (const start of startPositions) {
        if (findWordFromPosition(word, start, new Set([start.index]))) {
            return true;
        }
    }
    
    return false;
}

function findWordFromPosition(word, currentPos, visited) {
    // Base case: found the whole word
    if (visited.size === word.length) {
        return true;
    }
    
    const nextLetterIndex = visited.size;
    const nextLetter = word[nextLetterIndex];
    
    // Check all 8 adjacent positions
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
        const newRow = currentPos.row + dr;
        const newCol = currentPos.col + dc;
        
        if (newRow >= 0 && newRow < grid_size && newCol >= 0 && newCol < grid_size) {
            const newIndex = newCol * grid_size + newRow;
            
            if (!visited.has(newIndex) && gridLetters[newIndex] === nextLetter) {
                visited.add(newIndex);
                if (findWordFromPosition(word, {row: newRow, col: newCol, index: newIndex}, visited)) {
                    return true;
                }
                visited.delete(newIndex);
            }
        }
    }
    
    return false;
}

function checkWord(word) {
    const resultMsg = document.getElementById('resultMessage');
    if (!/^[A-Za-z]+$/.test(word)) {
        streak = 0;
        reason = ' (not in dictionary)'
        updateStreak();
        resultMsg.textContent = '✗ Try again' + reason;
        resultMsg.className = 'failure';
        setTimeout(() => {
            resultMsg.textContent = '';
            resultMsg.className = '';
        }, 1500);
        return
    }
    // console.log('Checking word:', word, 'Target:', targetWord, 'In dictionary:', dictionary.has(word));
    
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
    else if (word.length >= targetWord.length && dictionaries[word.length].some(item => item.toLowerCase() === word.toLowerCase()) && isWordOnBoard(word)) {
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
        if (!isWordOnBoard(word)) {
            reason = ' (not on board)';
        }
        else if (!dictionaries[word.length].some(item => item.toLowerCase() === word.toLowerCase())) {
            reason = ' (not in dictionary)';
        }
        else if (word.length < targetWord.length) {
            reason = ' (too short)';
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

function updateSkippedHistory() {
    const historyDiv = document.getElementById('skippedHistory');
    historyDiv.innerHTML = '';
    
    const recentSkipped = skippedWords.slice().reverse();
    
    if (recentSkipped.length === 0) {
        historyDiv.innerHTML = '<span style="color: #999; font-style: italic; font-size: 0.9em;">No skipped words...</span>';
        return;
    }
    
    recentSkipped.forEach(word => {
        const badge = document.createElement('div');
        badge.textContent = word;
        badge.style.cssText = `
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9em;
            text-align: center;
            background: #f44336;
            color: white;
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

function skipWord() {
    if (isProcessing) return; // Prevent multiple skips
    isProcessing = true;
    
    // Add to skipped words list
    skippedWords.push(targetWord);
    updateSkippedHistory();
    
    // Reset streak
    streak = 0;
    updateStreak();
    
    // Show skip message with the word
    const resultMsg = document.getElementById('resultMessage');
    resultMsg.textContent = `⏭️ Skipped - ${targetWord}`;
    resultMsg.className = 'failure';
    
    // Generate new grid after brief delay
    setTimeout(() => {
        generateGrid();
        resultMsg.textContent = '';
        resultMsg.className = '';
        isProcessing = false;
    }, 1500);
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
        // console.log('Highlighting cell', pos.index, cell);
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
document.addEventListener('mouseup', endSelection);
// End selection when mouse leaves the grid
document.addEventListener('mouseleave', (e) => {
    if (isSelecting && e.target.classList.contains('grid')) {
        endSelection();
        console.log('left grid')
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
        const word = getRandomWordOfLength(pathLength).toUpperCase();
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
    // console.log('togglePath called, pathVisible:', pathVisible, 'currentPath:', currentPath);
    pathVisible = !pathVisible;
    const button = event.target;
    
    if (pathVisible) {
        // Just show the existing path, don't generate a new one
        // console.log('Showing path...');
        button.textContent = 'Hide Path';
        highlightPath();
    } else {
        // console.log('Hiding path...');
        button.textContent = 'Show Path';
        clearPath();
    }
}

function highlightPath() {
    // console.log('highlightPath called, currentPath:', currentPath);
    if (!currentPath) {
        // console.log('No current path to highlight!');
        return;
    }
    
    const cells = document.querySelectorAll('.cell');
    // console.log('Total cells:', cells.length);
    currentPath.forEach((pos, index) => {
        const cellIndex = pos.row * gridSize + pos.col;
        const cell = cells[cellIndex];
        // console.log('Highlighting cell index:', cellIndex, 'Letter:', cell.textContent);
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
