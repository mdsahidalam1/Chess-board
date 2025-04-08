// script.js
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.gameId = this.generateUniqueId();
        this.timer = 600;
        this.gameHistory = JSON.parse(localStorage.getItem('chessHistory')) || [];
        this.playerId = this.generateUniqueId();
        this.vsComputerMode = false;
        
        this.initUI();
        this.startTimer();
        this.loadHistory();
    }

    initializeBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        // Pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = '♟';
            board[6][i] = '♙';
        }
        // Other pieces
        const pieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = pieces[i];
            board[7][i] = pieces[i].replace('♜', '♖').replace('♞', '♘')
                        .replace('♝', '♗').replace('♛', '♕').replace('♚', '♔');
        }
        return board;
    }

    generateUniqueId() {
        return 'CHESS_' + Math.random().toString(36).substr(2, 9);
    }

    initUI() {
        const board = document.getElementById('chessBoard');
        board.innerHTML = '';
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.className = `square ${(i + j) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = i;
                square.dataset.col = j;
                square.innerHTML = this.board[i][j] || '';
                square.addEventListener('click', () => this.handleClick(i, j));
                board.appendChild(square);
            }
        }

        document.getElementById('playerId').textContent = this.playerId;
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('vsComputer').addEventListener('click', () => this.vsComputer());
        document.getElementById('vsPlayer').addEventListener('click', () => this.vsPlayer());
        document.getElementById('loadGame').addEventListener('click', () => this.loadGame());
    }

    handleClick(row, col) {
        const piece = this.board[row][col];
        if (!this.selectedPiece) {
            if (piece && this.isPlayerPiece(piece)) {
                this.selectedPiece = { row, col };
                this.highlightMoves(row, col);
            }
        } else {
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.movePiece(row, col);
                this.saveGame();
            }
            this.clearHighlights();
            this.selectedPiece = null;
        }
    }

    isPlayerPiece(piece) {
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        const blackPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];
        return (this.currentPlayer === 'white' && whitePieces.includes(piece)) ||
               (this.currentPlayer === 'black' && blackPieces.includes(piece));
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];
        if (target && this.isPlayerPiece(target)) return false;

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        switch(piece) {
            case '♙': // White Pawn
                if (fromCol === toCol) {
                    if (fromRow === 6 && toRow === 4 && !this.board[5][toCol]) return true;
                    return toRow === fromRow - 1 && !target;
                }
                return rowDiff === 1 && colDiff === 1 && target;
            case '♟': // Black Pawn
                if (fromCol === toCol) {
                    if (fromRow === 1 && toRow === 3 && !this.board[2][toCol]) return true;
                    return toRow === fromRow + 1 && !target;
                }
                return rowDiff === 1 && colDiff === 1 && target;
            case '♖': // Rook
            case '♜':
                return (fromRow === toRow || fromCol === toCol) && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case '♘': // Knight
            case '♞':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case '♗': // Bishop
            case '♝':
                return rowDiff === colDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);
            case '♕': // Queen
            case '♛':
                return ((fromRow === toRow || fromCol === toCol) || rowDiff === colDiff) && 
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            case '♔': // King
            case '♚':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
        const colStep = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
        
        let row = fromRow + rowStep;
        let col = fromCol + colStep;
        
        while (row !== toRow || col !== toCol) {
            if (this.board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
    }

    highlightMoves(row, col) {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const r = parseInt(square.dataset.row);
            const c = parseInt(square.dataset.col);
            if (this.isValidMove(row, col, r, c)) {
                square.style.background = 'rgba(0, 255, 0, 0.3)';
            }
        });
    }

    clearHighlights() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            square.style.background = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
        });
    }

    movePiece(newRow, newCol) {
        const { row, col } = this.selectedPiece;
        this.board[newRow][newCol] = this.board[row][col];
        this.board[row][col] = null;
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.initUI();
        if (this.vsComputerMode && this.currentPlayer === 'black') {
            this.computerMove();
        }
    }

    startTimer() {
        setInterval(() => {
            if (this.timer > 0) {
                this.timer--;
                const minutes = Math.floor(this.timer / 60);
                const seconds = this.timer % 60;
                document.getElementById('timer').textContent = 
                    `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
            } else {
                this.endGame();
            }
        }, 1000);
    }

    saveGame() {
        const gameState = {
            id: this.gameId,
            board: this.board,
            timestamp: new Date().toISOString(),
            playerId: this.playerId
        };
        this.gameHistory.push(gameState);
        localStorage.setItem('chessHistory', JSON.stringify(this.gameHistory));
        this.loadHistory();
    }

    loadHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        this.gameHistory.forEach(game => {
            const li = document.createElement('li');
            li.textContent = `Game ${game.id} - ${new Date(game.timestamp).toLocaleString()}`;
            historyList.appendChild(li);
        });
    }

    newGame() {
        this.board = this.initializeBoard();
        this.timer = 600;
        this.gameId = this.generateUniqueId();
        this.currentPlayer = 'white';
        this.initUI();
    }

    vsComputer() {
        this.vsComputerMode = true;
        this.newGame();
    }

    vsPlayer() {
        this.vsComputerMode = false;
        this.newGame();
    }

    computerMove() {
        setTimeout(() => {
            const validMoves = [];
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (this.board[i][j] && this.isPlayerPiece(this.board[i][j])) {
                        for (let r = 0; r < 8; r++) {
                            for (let c = 0; c < 8; c++) {
                                if (this.isValidMove(i, j, r, c)) {
                                    validMoves.push({ from: { row: i, col: j }, to: { row: r, col: c } });
                                }
                            }
                        }
                    }
                }
            }
            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.selectedPiece = move.from;
                this.movePiece(move.to.row, move.to.col);
            }
        }, 1000);
    }

    loadGame() {
        if (this.gameHistory.length > 0) {
            const lastGame = this.gameHistory[this.gameHistory.length - 1];
            this.board = lastGame.board;
            this.gameId = lastGame.id;
            this.initUI();
        }
    }

    endGame() {
        alert('Time Up! Game Over');
        this.newGame();
    }
}

const game = new ChessGame();
     