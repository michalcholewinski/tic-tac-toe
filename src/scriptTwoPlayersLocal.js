const ticTacToeGame = new TicTacToeGame();
ticTacToeGame.start();

function TicTacToeGame() {
    const board = new Board();
    const player1 = new HumanPlayer(board, 'X');
    const player2 = new HumanPlayer(board, 'O');
    // const computerPlayer = new ComputerPlayer(board);
    let turn = 0;

    this.start = function () {
        const config = {childList: true};
        const observer = new MutationObserver(() => takeTurn());
        board.positions.forEach((el) => observer.observe(el, config));
        takeTurn();
    }

    function takeTurn() {
        if (board.checkForWinner()) {
            return;
        }

        if (turn % 2 === 0) {
            player1.takeTurn();
        } else {
            player2.takeTurn();
        }

        turn++;
    };
}

function Board() {
    this.positions = Array.from(document.querySelectorAll('.col'));

    this.checkForWinner = function () {
        let winner = false;

        const winningCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 4, 8],
            [2, 4, 6],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8]
        ];

        const positions = this.positions;
        winningCombinations.forEach((winningCombo) => {
            const pos0InnerText = positions[winningCombo[0]].innerText;
            const pos1InnerText = positions[winningCombo[1]].innerText;
            const pos2InnerText = positions[winningCombo[2]].innerText;
            const isWinningCombo = pos0InnerText !== '' &&
                pos0InnerText === pos1InnerText && pos1InnerText === pos2InnerText;
            if (isWinningCombo) {
                winner = true;
                winningCombo.forEach((index) => {
                    positions[index].className += ' winner';
                })
            }
        });

        return winner;
    }
}

function ComputerPlayer(board) {
    this.takeTurn = function () {
        let availablePositions = board.positions.filter((p) => p.innerText === '');
        const move = Math.floor(Math.random() * (availablePositions.length - 0));
        availablePositions[move].innerText = 'O';
    }
}

function HumanPlayer(board, symbol) {
    this.takeTurn = function () {
        board.positions.forEach(el =>
            el.addEventListener('click', clickHandler));
    }

    let clickHandler = (function(symbol) {
        return function handleTurnTaken(event) {

            if (event.target.innerText !== 'X' && event.target.innerText !== 'O') {
                event.target.innerText = symbol;
            }
            board.positions
                .forEach(el => el.removeEventListener('click', clickHandler));
        }
    })(symbol);
}