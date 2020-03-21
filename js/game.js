var config = {
    width: 597,
    height: 346,
    type: Phaser.AUTO,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var board = new Array(6); // Create a board to keep track of available cells
var xList, yList, helpText;
var gameFinished, isMoving, targetPos, enemyTurn, piece, bg, hovering;
var game = new Phaser.Game(config);

function preload() {
    // Pre-load all assets before the game starts
    this.load.image('background', 'assets/background.png');
    this.load.image('losebg', 'assets/losebg.png');
    this.load.image('winbg', 'assets/winbg.png');
    this.load.image('drawbg', 'assets/drawbg.png');
    this.load.image('red', 'assets/red.png');
    this.load.image('yellow', 'assets/yellow.png');
    this.load.image('redglow', 'assets/redglow.png');
    this.load.image('yellowglow', 'assets/yellowglow.png');
    this.load.image('restartbutton', 'assets/restartbutton.png');
    this.load.image('logo', 'assets/logo.png');
}

function create() {
    // Runs once when the game starts
    initialize(); // Initialize variables
    bg = this.add.sprite(299, 173, 'background');
    this.add.text(233, 65, 'Created by manish', {
        fill: '#0A4721',
        fontFamily: 'Verdana'
    });

    var restartButton = this.add.sprite(550, 310, 'restartbutton').setInteractive();
    var logo = this.add.sprite(550, 40, 'logo').setInteractive();
    restartButton.on('pointerdown', function(pointer) {
        game.scene.stop('default');
        game.scene.start('default');
    });
    restartButton.on('pointerover', function(pointer) {
        restartButton.setTint(0x70A0FE);
        hovering = true;
    });
    restartButton.on('pointerout', function(pointer) {
        restartButton.clearTint();
        hovering = false;
    });
    logo.on('pointerdown', function(pointer) {
        var win = window.open("https://github.com/iammanish17/Connect4", '_blank');
        window.focus();
    });
    logo.on('pointerover', function(pointer) {
        logo.setTint(0x70A0FE);
        hovering = true;
    });
    logo.on('pointerout', function(pointer) {
        logo.clearTint();
        hovering = false;
    });
}

function initialize() {
    // Function to initialize all variables
    for (var i = 0; i < 6; i++) {
        board[i] = [0, 0, 0, 0, 0, 0, 0];
    }
    xList = [189, 224, 258, 293, 327, 362, 396];
    yList = [89, 120, 151, 181, 212, 242];
    gameFinished = false;
    isMoving = false;
    targetPos = 0;
    enemyTurn = false;
    hovering = false;
}

function getSections(board) {
    // Returns all possible sections of 4 positions that could result in a win
    var sections = new Array();
    // Horizontal Sections
    for (var j = 0; j < 4; j++)
        for (var i = 0; i < 6; i++)
            sections.push([board[i][j], board[i][j + 1], board[i][j + 2], board[i][j + 3]]);
    // Vertical Sections
    for (var i = 0; i < 3; i++)
        for (var j = 0; j < 7; j++)
            sections.push([board[i][j], board[i + 1][j], board[i + 2][j], board[i + 3][j]]);
    // Negative-sloped Diagonal Sections
    for (var i = 0; i < 3; i++)
        for (var j = 0; j < 4; j++)
            sections.push([board[i][j], board[i + 1][j + 1], board[i + 2][j + 2], board[i + 3][j + 3]]);
    // Positive-sloped Diagonal Sections
    for (var i = 3; i < 6; i++)
        for (var j = 0; j < 4; j++)
            sections.push([board[i][j], board[i - 1][j + 1], board[i - 2][j + 2], board[i - 3][j + 3]]);

    return sections;
}

function isWinner(board, player) {
    // Checks if player has won the game
    var sections = getSections(board);
    for (i = 0; i < sections.length; i++) {
        var possible = true;
        for (j = 0; j < 4; j++) {
            if (sections[i][j] != player) possible = false;
        }
        if (possible) return true;
    }
    return false;
}

function sectionScore(section, player) {
    // Assigns a score to a section based on how likely player is to win/lose
    var score = 0;
    var selfCount = 0,
        opponentCount = 0,
        empty = 0;

    for (var i = 0; i < 4; i++) {
        if (section[i] == player) selfCount++;
        else if (section[i] == 3 - player) opponentCount++;
        else empty++;
    }

    if (selfCount == 4) score += 100;
    if (selfCount == 3 && empty == 1) score += 5;
    if (selfCount == 2 && empty == 2) score += 2;
    if (opponentCount == 3 && empty == 1) score -= 4;

    return score;
}

function getScore(board, player) {
    // Function to assign a score to a board
    var score = 0;
    var sections = getSections(board);

    for (var i = 0; i < sections.length; i++)
        score += sectionScore(sections[i], player);

    for (var i = 0; i < 6; i++)
        if (board[i][3] == player) score += 3;

    return score;
}

function isBoardFull(board) {
    // Function to check if any more moves are possible on the board
    for (var j = 0; j < 7; j++)
        if (board[0][j] == 0) return false;
    return true;
}

function miniMax(board, depth, alpha, beta, player) {
    // Minimax Algorithm for AI to recursively find an optimal move
    if (isWinner(board, 2)) return [-1, 99999999];
    if (isWinner(board, 1)) return [-1, -99999999];
    if (isBoardFull(board)) return [-1, 0];
    if (depth == 0) return [-1, getScore(board, 2)];

    if (player == 2) {
        // Maximizing player
        var value = Number.NEGATIVE_INFINITY;
        var col = -1;
        for (var i = 0; i < 7; i++) {
            if (board[0][i] == 0) {
                var boardCopy = new Array(6);
                for (var k = 0; k < board.length; k++)
                    boardCopy[k] = board[k].slice();
                var j = 5;
                for (j; j >= 0; j--) {
                    if (boardCopy[j][i] == 0)
                        break;
                }
                boardCopy[j][i] = player;
                var newScore = miniMax(boardCopy, depth - 1, alpha, beta, 3 - player)[1];
                if (newScore > value) {
                    value = newScore;
                    col = i;
                }
                alpha = Math.max(alpha, value);
                if (alpha >= beta) break;
            }
        }
        return [col, value];
    } else {
        // Minimizing player
        var value = Number.POSITIVE_INFINITY;
        var col = -1;
        for (var i = 0; i < 7; i++) {
            if (board[0][i] == 0) {
                var boardCopy = new Array(6);
                for (var k = 0; k < board.length; k++)
                    boardCopy[k] = board[k].slice();
                var j = 5;
                for (j; j >= 0; j--) {
                    if (boardCopy[j][i] == 0)
                        break;
                }
                boardCopy[j][i] = player;
                var newScore = miniMax(boardCopy, depth - 1, alpha, beta, 3 - player)[1];
                if (newScore < value) {
                    value = newScore;
                    col = i;
                }
                beta = Math.min(beta, value);
                if (alpha >= beta) break;
            }
        }
        return [col, value];
    }
}

function getConnectedPieces(board, winner) {
    // Returns an array of the co-ordinates of connected pieces of the winner
    var arr = new Array(6);
    for (var i = 0; i < 6; i++) {
        arr[i] = new Array(7);
        for (var j = 0; j < 7; j++)
            arr[i][j] = i * 7 + j;
    }

    var sections = getSections(board);
    var arraySections = getSections(arr);
    var positions = new Array();
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].toString() == [winner, winner, winner, winner].toString()) {
            for (var j = 0; j < 4; j++) {
                var pos = arraySections[i][j];
                positions.push([xList[pos % 7], yList[Math.floor(pos / 7)]]);
            }
            break;
        }
    }
    return positions;
}

function update() {
    game.canvas.style.cursor = "default"; // Default cursor
    if (hovering)
        game.canvas.style.cursor = "pointer"; // Change to pointer cursor

    if (gameFinished) return; // Do nothing if game is over

    if (isMoving && !enemyTurn) {
        // Player's piece is moving
        piece.y = Math.min(piece.y + 10, targetPos);
        if (piece.y == targetPos) {
            if (isWinner(board, 1)) { // If player 1 has won
                gameFinished = true;
                var positions = getConnectedPieces(board, 1);
                for (var k = 0; k < 4; k++) {
                    this.add.sprite(positions[k][0], positions[k][1], 'redglow').setOrigin(0, 0);
                }
                bg.setTexture('winbg');
                this.add.text(180, 300, 'You have won the game!', {
                    fill: '#292322',
                    font: 'bold 22px Tahoma'
                });
                return;
            }
            enemyTurn = !enemyTurn;
            var opponentMove = miniMax(board, 5, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, 2)[0];
            piece = this.add.sprite(xList[opponentMove], 80, 'yellow').setOrigin(0, 0);
            for (i = 5; i >= 0; i--) {
                if (board[i][opponentMove] == 0) {
                    board[i][opponentMove] = 2;
                    targetPos = yList[i];
                    break;
                }
            }
        }
        return;
    } else if (isMoving) {
        // AI's piece is moving
        piece.y = Math.min(piece.y + 10, targetPos);
        if (piece.y == targetPos) {
            enemyTurn = false;
            isMoving = false;
            if (isWinner(board, 2)) { // If player 2 has won
                gameFinished = true;
                var positions = getConnectedPieces(board, 2);
                for (var k = 0; k < 4; k++) {
                    this.add.sprite(positions[k][0], positions[k][1], 'yellowglow').setOrigin(0, 0);
                }
                bg.setTexture('losebg');
                this.add.text(180, 300, 'You have lost the game!', {
                    fill: '#292322',
                    font: 'bold 22px Tahoma'
                });
                return;
            } else if (isBoardFull(board)) {
                gameFinished = true;
                bg.setTexture('drawbg');
                this.add.text(180, 300, 'Board is full! Match draw.', {
                    fill: '#292322',
                    font: 'bold 22px Tahoma'
                });
            }
        }
        return;
    }

    var pointer = this.input.activePointer;
    var column = -1;
    var ypos = pointer.worldY;
    for (var i = 0; i < 7; i++) {
        var dist = pointer.worldX - xList[i];
        if (!board[0][i] && 5 <= dist && dist <= 30 && 95 <= ypos && ypos <= 270) {
            game.canvas.style.cursor = "pointer";
            column = i;
            break;
        }
    }

    if (column != -1 && pointer.primaryDown) {
        for (i = 5; i >= 0; i--) {
            if (board[i][column] == 0) {
                board[i][column] = 1;
                targetPos = yList[i];
                piece = this.add.sprite(xList[column], 80, 'red').setOrigin(0, 0);
                isMoving = true;
                break;
            }
        }
    }

}
