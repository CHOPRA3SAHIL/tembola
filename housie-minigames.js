// Housie Mini-Games Module
// This module handles all mini-game functionality for the Housie game

window.HousieMiniGames = (function() {
    'use strict';
    
    // Game configurations
    const GAMES = {
        quickMath: {
            name: 'Quick Math Challenge',
            description: 'Solve the equation before time runs out!',
            duration: 10000, // 10 seconds
            difficulty: 'easy'
        },
        colorCatch: {
            name: 'Color Catcher',
            description: 'Catch the falling colors in the right bucket!',
            duration: 15000, // 15 seconds
            difficulty: 'easy'
        },
        memoryFlash: {
            name: 'Memory Flash',
            description: 'Remember the sequence and repeat it!',
            duration: 12000, // 12 seconds
            difficulty: 'medium'
        },
        luckyWheel: {
            name: 'Lucky Wheel',
            description: 'Spin the wheel and test your luck!',
            duration: 8000, // 8 seconds
            difficulty: 'easy'
        },
        reactionTest: {
            name: 'Reaction Master',
            description: 'Click when you see the green light!',
            duration: 5000, // 5 seconds per round, 3 rounds
            difficulty: 'easy'
        }
    };
    
    // Game state
    let currentGame = null;
    let gameResult = null;
    let gameStartTime = null;
    let gameTimer = null;
    let gameCode = null;
    
    // Generate unique game code
    function generateGameCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // Encode game result
    function encodeGameResult(result) {
        const data = {
            game: result.game,
            won: result.won,
            score: result.score,
            time: result.time,
            code: result.code,
            player: result.player,
            timestamp: Date.now()
        };
        
        try {
            const jsonStr = JSON.stringify(data);
            if (typeof pako !== 'undefined') {
                const compressed = pako.deflate(jsonStr, { level: 9 });
                return btoa(String.fromCharCode.apply(null, compressed))
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
            }
            return btoa(jsonStr);
        } catch (e) {
            return btoa(JSON.stringify(data));
        }
    }
    
    // Decode game result
    function decodeGameResult(encoded) {
        try {
            const base64 = encoded
                .replace(/-/g, '+')
                .replace(/_/g, '/')
                .padEnd(encoded.length + (4 - encoded.length % 4) % 4, '=');
            
            if (typeof pako !== 'undefined') {
                const compressed = atob(base64).split('').map(c => c.charCodeAt(0));
                const jsonStr = pako.inflate(new Uint8Array(compressed), { to: 'string' });
                return JSON.parse(jsonStr);
            }
            return JSON.parse(atob(base64));
        } catch (e) {
            return null;
        }
    }
    
    // Create game modal
    function createGameModal() {
        const modal = document.createElement('div');
        modal.id = 'miniGameModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        const container = document.createElement('div');
        container.id = 'miniGameContainer';
        container.style.cssText = `
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: slideIn 0.5s ease;
        `;
        
        modal.appendChild(container);
        document.body.appendChild(modal);
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        `;
        document.head.appendChild(style);
        
        return container;
    }
    
    // Game 1: Quick Math Challenge
    function startQuickMath(container, config) {
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let a, b, answer;
        
        // Generate appropriate numbers based on operation
        switch (operation) {
            case '+':
                a = Math.floor(Math.random() * 50) + 10;
                b = Math.floor(Math.random() * 50) + 10;
                answer = a + b;
                break;
            case '-':
                a = Math.floor(Math.random() * 50) + 30;
                b = Math.floor(Math.random() * 30) + 10;
                answer = a - b;
                break;
            case '*':
                a = Math.floor(Math.random() * 12) + 2;
                b = Math.floor(Math.random() * 12) + 2;
                answer = a * b;
                break;
        }
        
        const startTime = Date.now();
        let timeLeft = config.duration / 1000;
        
        container.innerHTML = `
            <h2 style="text-align: center; color: #6366f1; margin-bottom: 1rem;">
                ${config.name}
            </h2>
            <div style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 2rem;">
                ${config.description}
            </div>
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
                    ${a} ${operation} ${b} = ?
                </div>
                <div id="mathTimer" style="font-size: 1.5rem; color: #ef4444;">
                    ${timeLeft}s
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                ${generateMathOptions(answer).map(opt => `
                    <button class="math-option" data-answer="${opt}" style="
                        padding: 1rem;
                        font-size: 1.5rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 0.75rem;
                        background: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Timer
        const timerEl = document.getElementById('mathTimer');
        const timer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            if (timeLeft <= 3) {
                timerEl.style.color = '#dc2626';
                timerEl.style.animation = 'pulse 0.5s ease infinite';
            }
            if (timeLeft <= 0) {
                clearInterval(timer);
                endGame(false, 0);
            }
        }, 1000);
        
        // Option handlers
        document.querySelectorAll('.math-option').forEach(btn => {
            btn.onclick = function() {
                clearInterval(timer);
                const selectedAnswer = parseInt(this.dataset.answer);
                const timeTaken = Date.now() - startTime;
                const score = Math.max(100 - Math.floor(timeTaken / 100), 10);
                endGame(selectedAnswer === answer, selectedAnswer === answer ? score : 0);
            };
        });
        
        function generateMathOptions(correct) {
            const options = [correct];
            while (options.length < 4) {
                const offset = Math.floor(Math.random() * 20) - 10;
                const wrong = correct + offset;
                if (wrong > 0 && !options.includes(wrong)) {
                    options.push(wrong);
                }
            }
            return options.sort(() => Math.random() - 0.5);
        }
    }
    
    // Game 2: Color Catcher
    function startColorCatch(container, config) {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
        const colorNames = ['Red', 'Blue', 'Green', 'Yellow'];
        let score = 0;
        let missed = 0;
        const maxMissed = 3;
        
        container.innerHTML = `
            <h2 style="text-align: center; color: #6366f1; margin-bottom: 1rem;">
                ${config.name}
            </h2>
            <div style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                ${config.description}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div>Score: <span id="catchScore" style="font-weight: bold;">0</span></div>
                <div>Missed: <span id="catchMissed" style="font-weight: bold; color: #ef4444;">0</span>/${maxMissed}</div>
            </div>
            <div id="gameArea" style="
                position: relative;
                height: 300px;
                background: #f9fafb;
                border: 2px solid #e5e7eb;
                border-radius: 0.75rem;
                overflow: hidden;
                margin-bottom: 1rem;
            "></div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;">
                ${colors.map((color, i) => `
                    <div class="color-bucket" data-color="${i}" style="
                        height: 60px;
                        background: ${color};
                        border-radius: 0.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        ${colorNames[i]}
                    </div>
                `).join('')}
            </div>
        `;
        
        const gameArea = document.getElementById('gameArea');
        let currentDrop = null;
        let dropSpeed = 2;
        let spawnInterval;
        
        // Bucket handlers
        document.querySelectorAll('.color-bucket').forEach(bucket => {
            bucket.onclick = function() {
                if (!currentDrop) return;
                
                const bucketColor = parseInt(this.dataset.color);
                const dropColor = parseInt(currentDrop.dataset.color);
                
                if (bucketColor === dropColor) {
                    score += 10;
                    document.getElementById('catchScore').textContent = score;
                    this.style.animation = 'pulse 0.3s ease';
                    setTimeout(() => this.style.animation = '', 300);
                    
                    currentDrop.remove();
                    currentDrop = null;
                } else {
                    this.style.animation = 'shake 0.3s ease';
                    setTimeout(() => this.style.animation = '', 300);
                }
            };
        });
        
        // Game loop
        function spawnDrop() {
            if (currentDrop) return;
            
            const colorIndex = Math.floor(Math.random() * colors.length);
            const drop = document.createElement('div');
            drop.className = 'color-drop';
            drop.dataset.color = colorIndex;
            drop.style.cssText = `
                position: absolute;
                width: 40px;
                height: 40px;
                background: ${colors[colorIndex]};
                border-radius: 50%;
                left: ${Math.random() * (gameArea.offsetWidth - 40)}px;
                top: -40px;
                transition: none;
            `;
            
            gameArea.appendChild(drop);
            currentDrop = drop;
            
            let pos = -40;
            const fallInterval = setInterval(() => {
                pos += dropSpeed;
                drop.style.top = pos + 'px';
                
                if (pos > gameArea.offsetHeight) {
                    clearInterval(fallInterval);
                    drop.remove();
                    if (currentDrop === drop) {
                        currentDrop = null;
                        missed++;
                        document.getElementById('catchMissed').textContent = missed;
                        
                        if (missed >= maxMissed) {
                            clearInterval(spawnInterval);
                            endGame(false, 0);
                        }
                    }
                }
            }, 20);
        }
        
        // Start spawning
        spawnInterval = setInterval(spawnDrop, 2000);
        spawnDrop();
        
        // End after duration
        setTimeout(() => {
            clearInterval(spawnInterval);
            endGame(score > 50, score);
        }, config.duration);
    }
    
    // Game 3: Memory Flash
    function startMemoryFlash(container, config) {
        const symbols = ['🌟', '🎈', '🎯', '🎪', '🎨', '🎭', '🎪', '🎸'];
        let sequence = [];
        let playerSequence = [];
        let level = 1;
        let showingSequence = true;
        
        container.innerHTML = `
            <h2 style="text-align: center; color: #6366f1; margin-bottom: 1rem;">
                ${config.name}
            </h2>
            <div style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                ${config.description}
            </div>
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 1.25rem;">Level: <span id="memoryLevel" style="font-weight: bold;">1</span></div>
            </div>
            <div id="memoryGrid" style="
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                max-width: 300px;
                margin: 0 auto 2rem;
            ">
                ${symbols.slice(0, 9).map((symbol, i) => `
                    <button class="memory-btn" data-index="${i}" style="
                        aspect-ratio: 1;
                        font-size: 2rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 0.75rem;
                        background: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " disabled>
                        ${symbol}
                    </button>
                `).join('')}
            </div>
            <div id="memoryStatus" style="text-align: center; font-size: 1rem; height: 2rem;">
                Watch the sequence...
            </div>
        `;
        
        const buttons = document.querySelectorAll('.memory-btn');
        const statusEl = document.getElementById('memoryStatus');
        
        // Button handlers
        buttons.forEach(btn => {
            btn.onclick = function() {
                if (showingSequence || this.disabled) return;
                
                const index = parseInt(this.dataset.index);
                playerSequence.push(index);
                
                this.style.background = '#dbeafe';
                setTimeout(() => this.style.background = 'white', 300);
                
                if (playerSequence.length === sequence.length) {
                    checkSequence();
                }
            };
        });
        
        function showSequence() {
            showingSequence = true;
            statusEl.textContent = 'Watch the sequence...';
            buttons.forEach(btn => btn.disabled = true);
            
            let i = 0;
            const showInterval = setInterval(() => {
                if (i > 0) {
                    buttons[sequence[i-1]].style.background = 'white';
                }
                
                if (i < sequence.length) {
                    buttons[sequence[i]].style.background = '#fbbf24';
                    i++;
                } else {
                    clearInterval(showInterval);
                    setTimeout(() => {
                        buttons[sequence[sequence.length-1]].style.background = 'white';
                        showingSequence = false;
                        statusEl.textContent = 'Your turn! Repeat the sequence';
                        buttons.forEach(btn => btn.disabled = false);
                        playerSequence = [];
                    }, 500);
                }
            }, 700);
        }
        
        function checkSequence() {
            const correct = sequence.every((val, idx) => val === playerSequence[idx]);
            
            if (correct) {
                level++;
                document.getElementById('memoryLevel').textContent = level;
                statusEl.textContent = 'Correct! Get ready for next level...';
                statusEl.style.color = '#10b981';
                
                if (level > 5) {
                    setTimeout(() => endGame(true, level * 20), 1000);
                } else {
                    sequence.push(Math.floor(Math.random() * 9));
                    setTimeout(() => {
                        statusEl.style.color = '#6b7280';
                        showSequence();
                    }, 1500);
                }
            } else {
                statusEl.textContent = 'Wrong sequence!';
                statusEl.style.color = '#ef4444';
                setTimeout(() => endGame(false, (level - 1) * 20), 1000);
            }
        }
        
        // Start game
        sequence = [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)];
        showSequence();
    }
    
    // Game 4: Lucky Wheel
    function startLuckyWheel(container, config) {
        const segments = [
            { label: 'WIN', color: '#10b981', value: 100 },
            { label: 'LOSE', color: '#ef4444', value: 0 },
            { label: 'WIN', color: '#10b981', value: 100 },
            { label: 'LOSE', color: '#ef4444', value: 0 },
            { label: 'MEGA', color: '#f59e0b', value: 200 },
            { label: 'LOSE', color: '#ef4444', value: 0 },
            { label: 'WIN', color: '#10b981', value: 100 },
            { label: 'LOSE', color: '#ef4444', value: 0 }
        ];
        
        container.innerHTML = `
            <h2 style="text-align: center; color: #6366f1; margin-bottom: 1rem;">
                ${config.name}
            </h2>
            <div style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 2rem;">
                ${config.description}
            </div>
            <div style="position: relative; width: 300px; height: 300px; margin: 0 auto 2rem;">
                <svg id="wheelSvg" width="300" height="300" style="transform: rotate(0deg); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);">
                    ${segments.map((seg, i) => {
                        const angle = (360 / segments.length);
                        const startAngle = i * angle - 90;
                        const endAngle = (i + 1) * angle - 90;
                        const x1 = 150 + 140 * Math.cos(startAngle * Math.PI / 180);
                        const y1 = 150 + 140 * Math.sin(startAngle * Math.PI / 180);
                        const x2 = 150 + 140 * Math.cos(endAngle * Math.PI / 180);
                        const y2 = 150 + 140 * Math.sin(endAngle * Math.PI / 180);
                        const labelAngle = startAngle + angle / 2;
                        const labelX = 150 + 90 * Math.cos(labelAngle * Math.PI / 180);
                        const labelY = 150 + 90 * Math.sin(labelAngle * Math.PI / 180);
                        
                        return `
                            <path d="M 150 150 L ${x1} ${y1} A 140 140 0 0 1 ${x2} ${y2} Z"
                                  fill="${seg.color}" stroke="white" stroke-width="2"/>
                            <text x="${labelX}" y="${labelY}" fill="white" text-anchor="middle" 
                                  dominant-baseline="middle" font-weight="bold" font-size="18">
                                ${seg.label}
                            </text>
                        `;
                    }).join('')}
                    <circle cx="150" cy="150" r="20" fill="#1f2937"/>
                </svg>
                <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 0; height: 0; 
                            border-left: 20px solid transparent; border-right: 20px solid transparent; 
                            border-top: 40px solid #1f2937;"></div>
            </div>
            <button id="spinBtn" style="
                display: block;
                margin: 0 auto;
                padding: 1rem 3rem;
                background: #6366f1;
                color: white;
                border: none;
                border-radius: 0.75rem;
                font-size: 1.25rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                SPIN THE WHEEL!
            </button>
            <div id="wheelResult" style="text-align: center; margin-top: 1rem; font-size: 1.25rem; height: 2rem;"></div>
        `;
        
        const wheel = document.getElementById('wheelSvg');
        const spinBtn = document.getElementById('spinBtn');
        const resultEl = document.getElementById('wheelResult');
        
        spinBtn.onclick = function() {
            spinBtn.disabled = true;
            spinBtn.style.opacity = '0.5';
            
            const spins = 5 + Math.random() * 3;
            const finalAngle = Math.random() * 360;
            const totalRotation = spins * 360 + finalAngle;
            
            wheel.style.transform = `rotate(${totalRotation}deg)`;
            
            setTimeout(() => {
                // Calculate which segment won
                const normalizedAngle = (360 - (finalAngle % 360)) % 360;
                const segmentAngle = 360 / segments.length;
                const winningIndex = Math.floor(normalizedAngle / segmentAngle);
                const winner = segments[winningIndex];
                
                resultEl.textContent = winner.label === 'MEGA' ? '🎉 MEGA WIN! 🎉' : 
                                      winner.value > 0 ? '✅ You Won!' : '❌ Try Again!';
                resultEl.style.color = winner.color;
                
                setTimeout(() => {
                    endGame(winner.value > 0, winner.value);
                }, 1500);
            }, 4000);
        };
    }
    
    // Game 5: Reaction Test
    function startReactionTest(container, config) {
        let round = 0;
        const maxRounds = 3;
        let totalReactionTime = 0;
        let waitingForGreen = false;
        let greenShowTime = 0;
        let timeout = null;
        
        container.innerHTML = `
            <h2 style="text-align: center; color: #6366f1; margin-bottom: 1rem;">
                ${config.name}
            </h2>
            <div style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
                ${config.description}
            </div>
            <div style="text-align: center; margin-bottom: 2rem;">
                <div>Round: <span id="reactionRound" style="font-weight: bold;">1</span>/${maxRounds}</div>
                <div>Average Time: <span id="avgTime" style="font-weight: bold;">--</span>ms</div>
            </div>
            <div id="reactionBox" style="
                width: 100%;
                height: 200px;
                background: #ef4444;
                border-radius: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                margin-bottom: 1rem;
            ">
                Click to Start
            </div>
            <div id="reactionResult" style="text-align: center; font-size: 1rem; height: 2rem;"></div>
        `;
        
        const box = document.getElementById('reactionBox');
        const resultEl = document.getElementById('reactionResult');
        
        box.onclick = function() {
            if (!waitingForGreen && round < maxRounds) {
                // Start round
                round++;
                document.getElementById('reactionRound').textContent = round;
                box.style.background = '#ef4444';
                box.textContent = 'Wait for Green...';
                resultEl.textContent = '';
                waitingForGreen = true;
                
                // Random delay
                const delay = 2000 + Math.random() * 3000;
                timeout = setTimeout(() => {
                    box.style.background = '#10b981';
                    box.textContent = 'CLICK NOW!';
                    greenShowTime = Date.now();
                }, delay);
                
            } else if (waitingForGreen && box.style.background === 'rgb(16, 185, 129)') {
                // Clicked on green
                const reactionTime = Date.now() - greenShowTime;
                totalReactionTime += reactionTime;
                
                resultEl.textContent = `Reaction time: ${reactionTime}ms`;
                resultEl.style.color = reactionTime < 300 ? '#10b981' : 
                                      reactionTime < 500 ? '#f59e0b' : '#ef4444';
                
                const avgTime = Math.round(totalReactionTime / round);
                document.getElementById('avgTime').textContent = avgTime;
                
                waitingForGreen = false;
                box.style.background = '#6366f1';
                box.textContent = round < maxRounds ? 'Click for Next Round' : 'Game Complete!';
                
                if (round >= maxRounds) {
                    setTimeout(() => {
                        const score = Math.max(100 - Math.floor(avgTime / 5), 0);
                        endGame(avgTime < 500, score);
                    }, 1500);
                }
                
            } else if (waitingForGreen) {
                // Clicked too early
                clearTimeout(timeout);
                waitingForGreen = false;
                box.style.background = '#ef4444';
                box.textContent = 'Too Early! Click to Try Again';
                resultEl.textContent = 'You clicked too early!';
                resultEl.style.color = '#ef4444';
                round--;
            }
        };
    }
    
    // End game and generate code
    function endGame(won, score) {
        if (gameTimer) clearInterval(gameTimer);
        
        gameCode = generateGameCode();
        const timeTaken = Date.now() - gameStartTime;
        
        gameResult = {
            game: currentGame,
            won: won,
            score: score,
            time: timeTaken,
            code: gameCode,
            player: window.playerName || 'Unknown'
        };
        
        // Store result
        sessionStorage.setItem(`miniGameResult_${gameCode}`, JSON.stringify(gameResult));
        
        // Show result
        showGameResult();
    }
    
    // Show game result
    function showGameResult() {
        const container = document.getElementById('miniGameContainer');
        const game = GAMES[currentGame];
        
        container.innerHTML = `
            <h2 style="text-align: center; color: ${gameResult.won ? '#10b981' : '#ef4444'}; margin-bottom: 1rem;">
                ${gameResult.won ? '🎉 You Won!' : '😢 Better Luck Next Time!'}
            </h2>
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">${game.name}</div>
                <div style="font-size: 2rem; font-weight: bold; color: #6366f1;">
                    Score: ${gameResult.score}
                </div>
            </div>
            <div style="background: #f9fafb; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
                <div style="text-align: center; margin-bottom: 0.5rem; font-size: 0.875rem; color: #6b7280;">
                    Share this code with the admin:
                </div>
                <div style="text-align: center; font-size: 2rem; font-weight: bold; color: #1f2937; 
                            letter-spacing: 0.25rem; user-select: all; cursor: pointer;"
                     onclick="copyGameCode('${gameResult.code}')">
                    ${gameResult.code}
                </div>
                <div style="text-align: center; margin-top: 0.5rem;">
                    <button onclick="copyGameCode('${gameResult.code}')" style="
                        padding: 0.5rem 1rem;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        font-size: 0.875rem;
                    ">
                        Copy Code
                    </button>
                </div>
            </div>
            <button onclick="HousieMiniGames.closeGame()" style="
                width: 100%;
                padding: 1rem;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 0.75rem;
                font-size: 1.125rem;
                font-weight: bold;
                cursor: pointer;
            ">
                Continue Playing Housie
            </button>
        `;
        
        // Show celebration if won
        if (gameResult.won && window.showCelebration) {
            window.showCelebration();
        }
        
        // Save result to display later
        const resultSummary = document.createElement('div');
        resultSummary.id = 'miniGameResultSummary';
        resultSummary.style.cssText = `
            background: ${gameResult.won ? '#f0fdf4' : '#fee2e2'};
            border: 1px solid ${gameResult.won ? '#bbf7d0' : '#fecaca'};
            padding: 1rem;
            border-radius: 0.75rem;
            margin-bottom: 1rem;
            text-align: center;
        `;
        resultSummary.innerHTML = `
            <div style="font-weight: bold; color: ${gameResult.won ? '#059669' : '#dc2626'};">
                ${game.name}: ${gameResult.won ? 'Won' : 'Lost'} (Code: ${gameResult.code})
            </div>
        `;
        
        // Store for later display
        window.miniGameResultSummary = resultSummary;
    }
    
    // Copy game code
    window.copyGameCode = function(code) {
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Code copied to clipboard!');
        });
    };
    
    // Public API
    return {
        // Initialize mini-games
        init: function(config) {
            if (!config || !config.enabled) return;
            
            // Store config
            window.miniGameConfig = config;
            
            // Set timer to show game
            if (config.showAfterMinutes > 0) {
                setTimeout(() => {
                    this.showRandomGame();
                }, config.showAfterMinutes * 60 * 1000);
            }
        },
        
        // Show a random game
        showRandomGame: function() {
            // Check if ticket is already locked
            if (document.querySelector('.ticket-locked-overlay')) {
                console.log('Ticket is locked, cannot show mini-game');
                return;
            }
            
            // Select random game
            const gameKeys = Object.keys(GAMES);
            currentGame = gameKeys[Math.floor(Math.random() * gameKeys.length)];
            
            // Lock the ticket
            this.lockTicket();
            
            // Create and show game modal
            const container = createGameModal();
            gameStartTime = Date.now();
            
            // Start the selected game
            switch (currentGame) {
                case 'quickMath':
                    startQuickMath(container, GAMES[currentGame]);
                    break;
                case 'colorCatch':
                    startColorCatch(container, GAMES[currentGame]);
                    break;
                case 'memoryFlash':
                    startMemoryFlash(container, GAMES[currentGame]);
                    break;
                case 'luckyWheel':
                    startLuckyWheel(container, GAMES[currentGame]);
                    break;
                case 'reactionTest':
                    startReactionTest(container, GAMES[currentGame]);
                    break;
            }
        },
        
        // Lock ticket during mini-game
        lockTicket: function() {
            const ticketCells = document.querySelectorAll('.ticket-cell');
            ticketCells.forEach(cell => {
                cell.style.pointerEvents = 'none';
                cell.style.opacity = '0.5';
            });
            
            // Add overlay message
            const ticketContainer = document.getElementById('ticketContainer');
            if (ticketContainer) {
                const overlay = document.createElement('div');
                overlay.id = 'miniGameLockOverlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.75rem;
                    z-index: 100;
                `;
                overlay.innerHTML = `
                    <div style="color: white; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold;">Mini-Game in Progress</div>
                        <div style="margin-top: 0.5rem;">Complete the game to continue</div>
                    </div>
                `;
                ticketContainer.appendChild(overlay);
            }
        },
        
        // Unlock ticket after mini-game
        unlockTicket: function() {
            const ticketCells = document.querySelectorAll('.ticket-cell');
            ticketCells.forEach(cell => {
                cell.style.pointerEvents = 'auto';
                cell.style.opacity = '1';
            });
            
            // Remove overlay
            const overlay = document.getElementById('miniGameLockOverlay');
            if (overlay) overlay.remove();
        },
        
        // Close game and return to ticket
        closeGame: function() {
            const modal = document.getElementById('miniGameModal');
            if (modal) modal.remove();
            
            this.unlockTicket();
            
            // Add result summary to ticket area if exists
            if (window.miniGameResultSummary) {
                const progressSection = document.getElementById('progressSection');
                if (progressSection) {
                    progressSection.insertBefore(window.miniGameResultSummary, progressSection.firstChild);
                }
            }
        },
        
        // Verify game code (for admin)
        verifyGameCode: function(code) {
            const stored = sessionStorage.getItem(`miniGameResult_${code}`);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Try to decode if it's an encoded result
            const decoded = decodeGameResult(code);
            if (decoded && decoded.code) {
                return decoded;
            }
            
            return null;
        },
        
        // Get mini-game configuration options
        getConfigOptions: function() {
            return {
                enabled: false,
                showAfterMinutes: 5,
                prizeMode: 'fixed', // 'fixed' or 'multiplier'
                prizeAmount: 10,
                multiplier: 2,
                allowMultipleGames: false
            };
        },
        
        // Encode config for URL
        encodeConfig: function(config) {
            return encodeGameResult(config);
        },
        
        // Decode config from URL
        decodeConfig: function(encoded) {
            return decodeGameResult(encoded);
        }
    };
})();