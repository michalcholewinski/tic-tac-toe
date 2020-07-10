const getElement = (id) => document.getElementById(id);
const addMessage = (message) => {
    const pTag = document.createElement('p');
    pTag.appendChild(document.createTextNode(message));
    getElement('messages').appendChild(pTag);
};

const ws = new WebSocket('ws://localhost:3030');

const fire = () => {
    const username = getElement('name').value || '???'
    ws.send(`${username}: ${getElement('message').value}`);
    getElement('message').value = '';

};

const reset = () => {
    ws.send(`RESET_GAME`);

};


const ticTacToeGame = new TicTacToeGame();

function TicTacToeGame() {
    const board = new Board();
    let player;
    let canTakeTurn = false;
    ws.onopen = () => {
        console.log('Now connected');
    };
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (typeof message === 'object') {
            switch (message.key) {
                case 'PLAYER':
                    console.log(message.value);
                    player = new HumanPlayer(board, message.value);
                    break;
                case 'STATE':
                    console.log(message.value);
                    board.positions.forEach((el) => {
                        const id = el.id;
                        const currentValue = message.value[id - 1];
                        el.innerText = currentValue;
                    });
                    break;
                case 'READY_TO_START':
                    if (player) {
                        canTakeTurn = player.symbol() === message.value;
                        this.start();
                    }
                    break;
                case 'TURN':
                    if (player) {
                        canTakeTurn = player.symbol() === message.value;
                    }
                    break;
                default:
                    message.value.forEach(addMessage);
            }
        }
    }

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

        // if (turn % 2 === 0) {
        player && player.takeTurn();
    }

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

function HumanPlayer(board, symbol) {
    this.symbol = function () {
        return symbol;
    }
    this.takeTurn = function () {
        board.positions.forEach(el =>
            el.addEventListener('click', clickHandler));
    }

    let clickHandler = (function (symbol) {
        return function handleTurnTaken(event) {

            if (event.target.innerText !== 'X' && event.target.innerText !== 'O') {
                // event.target.innerText = symbol;
                ws.send(JSON.stringify({key: 'CHOICE', value: event.target.id, symbol: symbol}));
                board.positions
                    .forEach(el => el.removeEventListener('click', clickHandler));
            }

        }
    })(symbol);
}