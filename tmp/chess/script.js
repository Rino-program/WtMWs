const PIECES = {
    WHITE_KING: '♔', WHITE_QUEEN: '♕', WHITE_ROOK: '♖',
    WHITE_BISHOP: '♗', WHITE_KNIGHT: '♘', WHITE_PAWN: '♙',
    BLACK_KING: '♚', BLACK_QUEEN: '♛', BLACK_ROOK: '♜',
    BLACK_BISHOP: '♝', BLACK_KNIGHT: '♞', BLACK_PAWN: '♟'
};

let board = [];
let selectedSquare = null;
let currentTurn = 'white';
let moveHistory = [];
let capturedWhite = [];
let capturedBlack = [];
let lastMove = null;
let enPassantTarget = null;
let castlingRights = {
    whiteKing: true,
    whiteQueenRook: true,
    whiteKingRook: true,
    blackKing: true,
    blackQueenRook: true,
    blackKingRook: true
};

function isWhite(piece) {
    return '♔♕♖♗♘♙'.includes(piece);
}

function isBlack(piece) {
    return '♚♛♜♝♞♟'.includes(piece);
}

function getPieceColor(piece) {
    if (isWhite(piece)) return 'white';
    if (isBlack(piece)) return 'black';
    return null;
}

function initBoard() {
    board = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.textContent = board[row][col];

            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('selected');
            }

            if (lastMove) {
                if ((lastMove.from.row === row && lastMove.from.col === col) ||
                    (lastMove.to.row === row && lastMove.to.col === col)) {
                    square.classList.add('last-move');
                }
            }

            const piece = board[row][col];
            if ((piece === '♔' && isInCheck('white')) || (piece === '♚' && isInCheck('black'))) {
                square.classList.add('check');
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            boardEl.appendChild(square);
        }
    }
}

function showValidMoves(row, col) {
    const moves = getValidMoves(row, col);
    const squares = document.querySelectorAll('.square');

    squares.forEach(sq => {
        const r = parseInt(sq.dataset.row);
        const c = parseInt(sq.dataset.col);
        const move = moves.find(m => m.row === r && m.col === c);
        if (move) {
            sq.classList.add(board[r][c] ? 'valid-capture' : 'valid-move');
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'valid-move', 'valid-capture');
    });
}

function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const color = getPieceColor(piece);
    let moves = [];

    switch (piece) {
        case '♙':
            if (row > 0 && !board[row - 1][col]) {
                moves.push({ row: row - 1, col });
                if (row === 6 && !board[row - 2][col]) moves.push({ row: row - 2, col });
            }
            if (row > 0 && col > 0 && isBlack(board[row - 1][col - 1])) moves.push({ row: row - 1, col: col - 1 });
            if (row > 0 && col < 7 && isBlack(board[row - 1][col + 1])) moves.push({ row: row - 1, col: col + 1 });
            // En passant for white
            if (row === 3 && enPassantTarget) {
                if (enPassantTarget.row === 2 && Math.abs(enPassantTarget.col - col) === 1) {
                    moves.push({ row: 2, col: enPassantTarget.col, enPassant: true });
                }
            }
            break;
        case '♟':
            if (row < 7 && !board[row + 1][col]) {
                moves.push({ row: row + 1, col });
                if (row === 1 && !board[row + 2][col]) moves.push({ row: row + 2, col });
            }
            if (row < 7 && col > 0 && isWhite(board[row + 1][col - 1])) moves.push({ row: row + 1, col: col - 1 });
            if (row < 7 && col < 7 && isWhite(board[row + 1][col + 1])) moves.push({ row: row + 1, col: col + 1 });
            // En passant for black
            if (row === 4 && enPassantTarget) {
                if (enPassantTarget.row === 5 && Math.abs(enPassantTarget.col - col) === 1) {
                    moves.push({ row: 5, col: enPassantTarget.col, enPassant: true });
                }
            }
            break;
        case '♘':
        case '♞':
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    if (!board[nr][nc] || getPieceColor(board[nr][nc]) !== color) moves.push({ row: nr, col: nc });
                }
            });
            break;
        case '♗':
        case '♝':
            moves = getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]], color);
            break;
        case '♖':
        case '♜':
            moves = getSlidingMoves(row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]], color);
            break;
        case '♕':
        case '♛':
            moves = getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], color);
            break;
        case '♔':
        case '♚':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    if (!board[nr][nc] || getPieceColor(board[nr][nc]) !== color) moves.push({ row: nr, col: nc });
                }
            });
            if (color === 'white' && castlingRights.whiteKing && row === 7 && col === 4) {
                if (castlingRights.whiteKingRook && !board[7][5] && !board[7][6] && board[7][7] === '♖') {
                    if (!isSquareAttacked(7, 4, 'black') && !isSquareAttacked(7, 5, 'black') && !isSquareAttacked(7, 6, 'black')) {
                        moves.push({ row: 7, col: 6, castle: 'kingside' });
                    }
                }
                if (castlingRights.whiteQueenRook && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0] === '♖') {
                    if (!isSquareAttacked(7, 4, 'black') && !isSquareAttacked(7, 3, 'black') && !isSquareAttacked(7, 2, 'black')) {
                        moves.push({ row: 7, col: 2, castle: 'queenside' });
                    }
                }
            }
            if (color === 'black' && castlingRights.blackKing && row === 0 && col === 4) {
                if (castlingRights.blackKingRook && !board[0][5] && !board[0][6] && board[0][7] === '♜') {
                    if (!isSquareAttacked(0, 4, 'white') && !isSquareAttacked(0, 5, 'white') && !isSquareAttacked(0, 6, 'white')) {
                        moves.push({ row: 0, col: 6, castle: 'kingside' });
                    }
                }
                if (castlingRights.blackQueenRook && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0] === '♜') {
                    if (!isSquareAttacked(0, 4, 'white') && !isSquareAttacked(0, 3, 'white') && !isSquareAttacked(0, 2, 'white')) {
                        moves.push({ row: 0, col: 2, castle: 'queenside' });
                    }
                }
            }
            break;
    }

    return moves.filter(move => {
        const tempBoard = board.map(r => [...r]);
        board[move.row][move.col] = board[row][col];
        board[row][col] = '';
        const inCheck = isInCheck(color);
        board = tempBoard;
        return !inCheck;
    });
}

function getSlidingMoves(row, col, directions, color) {
    const moves = [];
    directions.forEach(([dr, dc]) => {
        let nr = row + dr, nc = col + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!board[nr][nc]) moves.push({ row: nr, col: nc });
            else {
                if (getPieceColor(board[nr][nc]) !== color) moves.push({ row: nr, col: nc });
                break;
            }
            nr += dr;
            nc += dc;
        }
    });
    return moves;
}

function isSquareAttacked(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && getPieceColor(piece) === byColor) {
                const attackMoves = getAttackSquares(r, c, piece);
                if (attackMoves.some(m => m.row === row && m.col === col)) return true;
            }
        }
    }
    return false;
}

function getAttackSquares(row, col, piece) {
    const color = getPieceColor(piece);
    let moves = [];

    switch (piece) {
        case '♙':
            if (row > 0 && col > 0) moves.push({ row: row - 1, col: col - 1 });
            if (row > 0 && col < 7) moves.push({ row: row - 1, col: col + 1 });
            break;
        case '♟':
            if (row < 7 && col > 0) moves.push({ row: row + 1, col: col - 1 });
            if (row < 7 && col < 7) moves.push({ row: row + 1, col: col + 1 });
            break;
        case '♘':
        case '♞':
            [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]].forEach(([dr, dc]) => {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push({ row: nr, col: nc });
            });
            break;
        case '♗':
        case '♝':
            moves = getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]], color);
            break;
        case '♖':
        case '♜':
            moves = getSlidingMoves(row, col, [[-1, 0], [1, 0], [0, -1], [0, 1]], color);
            break;
        case '♕':
        case '♛':
            moves = getSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], color);
            break;
        case '♔':
        case '♚':
            [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]].forEach(([dr, dc]) => {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push({ row: nr, col: nc });
            });
            break;
    }
    return moves;
}

function isInCheck(color) {
    let kingRow, kingCol;
    const king = color === 'white' ? '♔' : '♚';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
    }
    return isSquareAttacked(kingRow, kingCol, color === 'white' ? 'black' : 'white');
}

function hasValidMoves(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && getPieceColor(piece) === color) {
                if (getValidMoves(r, c).length > 0) return true;
            }
        }
    }
    return false;
}

function handleSquareClick(row, col) {
    const piece = board[row][col];

    if (selectedSquare) {
        const validMoves = getValidMoves(selectedSquare.row, selectedSquare.col);
        const move = validMoves.find(m => m.row === row && m.col === col);

        if (move) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col, move);
            selectedSquare = null;
            clearHighlights();
            return;
        }
    }

    if (piece && getPieceColor(piece) === currentTurn) {
        clearHighlights();
        selectedSquare = { row, col };
        renderBoard();
        document.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
        showValidMoves(row, col);
    } else {
        selectedSquare = null;
        clearHighlights();
        renderBoard();
    }
}

function makeMove(fromRow, fromCol, toRow, toCol, moveInfo = {}) {
    const piece = board[fromRow][fromCol];
    const captured = board[toRow][toCol];

    moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece, captured,
        castlingRights: { ...castlingRights },
        enPassantTarget: enPassantTarget ? { ...enPassantTarget } : null,
        moveInfo
    });

    if (captured) {
        if (isWhite(captured)) capturedWhite.push(captured);
        else capturedBlack.push(captured);
    }

    // Handle en passant capture
    if (moveInfo.enPassant) {
        const capturedRow = piece === '♙' ? toRow + 1 : toRow - 1;
        const capturedPawn = board[capturedRow][toCol];
        if (capturedPawn) {
            if (isWhite(capturedPawn)) capturedWhite.push(capturedPawn);
            else capturedBlack.push(capturedPawn);
        }
        board[capturedRow][toCol] = '';
    }

    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';

    // Set en passant target for next turn
    enPassantTarget = null;
    if ((piece === '♙' && fromRow === 6 && toRow === 4) ||
        (piece === '♟' && fromRow === 1 && toRow === 3)) {
        enPassantTarget = { row: piece === '♙' ? 5 : 2, col: toCol };
    }

    if (moveInfo.castle === 'kingside') {
        if (currentTurn === 'white') {
            board[7][5] = board[7][7];
            board[7][7] = '';
        } else {
            board[0][5] = board[0][7];
            board[0][7] = '';
        }
    } else if (moveInfo.castle === 'queenside') {
        if (currentTurn === 'white') {
            board[7][3] = board[7][0];
            board[7][0] = '';
        } else {
            board[0][3] = board[0][0];
            board[0][0] = '';
        }
    }

    if (piece === '♔') castlingRights.whiteKing = false;
    if (piece === '♚') castlingRights.blackKing = false;
    if (fromRow === 7 && fromCol === 0) castlingRights.whiteQueenRook = false;
    if (fromRow === 7 && fromCol === 7) castlingRights.whiteKingRook = false;
    if (fromRow === 0 && fromCol === 0) castlingRights.blackQueenRook = false;
    if (fromRow === 0 && fromCol === 7) castlingRights.blackKingRook = false;

    if ((piece === '♙' && toRow === 0) || (piece === '♟' && toRow === 7)) {
        showPromotionModal(toRow, toCol, currentTurn);
        return;
    }

    finishMove(fromRow, fromCol, toRow, toCol);
}

function showPromotionModal(row, col, color) {
    const modal = document.getElementById('promotion-modal');
    const pieces = document.getElementById('promotion-pieces');
    pieces.innerHTML = '';

    const promotionPieces = color === 'white' ? ['♕', '♖', '♗', '♘'] : ['♛', '♜', '♝', '♞'];

    promotionPieces.forEach(p => {
        const el = document.createElement('div');
        el.className = 'promotion-piece';
        el.textContent = p;
        el.onclick = () => {
            board[row][col] = p;
            modal.classList.remove('active');
            const lastHistory = moveHistory[moveHistory.length - 1];
            finishMove(lastHistory.from.row, lastHistory.from.col, row, col);
        };
        pieces.appendChild(el);
    });

    modal.classList.add('active');
}

function finishMove(fromRow, fromCol, toRow, toCol) {
    lastMove = { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } };
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    renderBoard();
    updateUI();
    checkGameEnd();
}

function checkGameEnd() {
    if (!hasValidMoves(currentTurn)) {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');

        if (isInCheck(currentTurn)) {
            const winner = currentTurn === 'white' ? '黒' : '白';
            title.textContent = 'チェックメイト！';
            message.textContent = `${winner}の勝利です！`;
        } else {
            title.textContent = 'ステイルメイト！';
            message.textContent = '引き分けです。';
        }
        modal.classList.add('active');
    }
}

function updateUI() {
    const status = document.getElementById('status');
    status.textContent = currentTurn === 'white' ? '白のターン' : '黒のターン';
    status.className = `status ${currentTurn}-turn`;
    if (isInCheck(currentTurn)) status.textContent += ' - チェック！';

    document.getElementById('captured-white').textContent = capturedWhite.join(' ');
    document.getElementById('captured-black').textContent = capturedBlack.join(' ');

    const moveList = document.getElementById('move-list');
    moveList.innerHTML = '';

    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveNum = Math.floor(i / 2) + 1;
        const whiteMove = moveHistory[i];
        const blackMove = moveHistory[i + 1];
        moveList.innerHTML += `
            <span class="num">${moveNum}.</span>
            <span class="white-move">${formatMove(whiteMove)}</span>
            <span class="black-move">${blackMove ? formatMove(blackMove) : ''}</span>
        `;
    }
}

function formatMove(move) {
    const cols = 'abcdefgh';
    const rows = '87654321';
    let notation = '';

    if (move.moveInfo?.castle === 'kingside') return 'O-O';
    if (move.moveInfo?.castle === 'queenside') return 'O-O-O';

    if (!'♙♟'.includes(move.piece)) notation += move.piece;
    if (move.captured) {
        if ('♙♟'.includes(move.piece)) notation += cols[move.from.col];
        notation += 'x';
    }
    notation += cols[move.to.col] + rows[move.to.row];
    return notation;
}

function undoMove() {
    if (moveHistory.length === 0) return;

    const lm = moveHistory.pop();
    board[lm.from.row][lm.from.col] = lm.piece;
    board[lm.to.row][lm.to.col] = lm.captured || '';

    if (lm.captured) {
        if (isWhite(lm.captured)) capturedWhite.pop();
        else capturedBlack.pop();
    }

    if (lm.moveInfo?.castle === 'kingside') {
        if (lm.piece === '♔') {
            board[7][7] = board[7][5];
            board[7][5] = '';
        } else {
            board[0][7] = board[0][5];
            board[0][5] = '';
        }
    } else if (lm.moveInfo?.castle === 'queenside') {
        if (lm.piece === '♔') {
            board[7][0] = board[7][3];
            board[7][3] = '';
        } else {
            board[0][0] = board[0][3];
            board[0][3] = '';
        }
    }

    castlingRights = lm.castlingRights;
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    renderBoard();
    updateUI();
}

function newGame() {
    document.getElementById('game-over-modal').classList.remove('active');
    document.getElementById('promotion-modal').classList.remove('active');

    initBoard();
    selectedSquare = null;
    currentTurn = 'white';
    moveHistory = [];
    capturedWhite = [];
    capturedBlack = [];
    lastMove = null;
    castlingRights = {
        whiteKing: true,
        whiteQueenRook: true,
        whiteKingRook: true,
        blackKing: true,
        blackQueenRook: true,
        blackKingRook: true
    };

    renderBoard();
    updateUI();
}

newGame();
