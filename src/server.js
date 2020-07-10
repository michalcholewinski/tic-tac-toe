const express = require('express');
const path = require('path');
const WebSocket = require('ws'); // new
const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

const port = 8765;
app.listen(port, () => {
    console.log(`listening http://localhost:${port}`);
});

const socketServer = new WebSocket.Server({port: 3030});

const messages = ['Witaj w grze!'];

let playerX;
let playerO;
const observers = [];
let numberOfObservers = 0;
const gameState = [null, null, null, null, null, null, null, null, null];
let turn = 'X';
let readyToStartSignalSent = false;


socketServer.on('connection', (socketClient) => {
    console.log('connected');
    console.log('Number of clients: ', socketServer.clients.size);
    // socketClient.send(JSON.stringify(messages));
    if (!playerX) {
        playerX = socketClient;
        playerX.send(JSON.stringify({key: 'MESSAGE', value: ['Jestes X']}));
        playerX.send(JSON.stringify({key: 'PLAYER', value: 'X'}));
        sendMessages('MESSAGE', "Player X dołączył do gry");
        playerX.on('message', messageHandler('X'));
    } else if (!playerO) {
        playerO = socketClient;
        playerO.send(JSON.stringify({key: 'MESSAGE', value: ['Jestes O']}));
        playerO.send(JSON.stringify({key: 'PLAYER', value: 'O'}));
        sendMessages('MESSAGE', "Player O dołączył do gry");
        playerO.on('message', messageHandler('O'));
    } else {
        observers[numberOfObservers] = socketClient;
        observers[numberOfObservers].send(JSON.stringify(['Jestes obserwatorem meczu']));
        numberOfObservers++;
        sendMessages('MESSAGE', `Liczba obserwatorów ${numberOfObservers}`);
    }
    if (!readyToStartSignalSent && playerX && playerO) {
        sendReadyToStartSignal();
        readyToStartSignalSent = true;
        sendCurrentTurn();
    }

    sendState(gameState);

    function sendMessages(type, message) {
        messages.push(message);
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({key: type, value: [message]}));
            }
        });
    }

    function sendState(state) {
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({key: 'STATE', value: state}));
            }
        });
    }

    function sendCurrentTurn() {
        sendMessages('MESSAGE', `Player ${turn}, Twoja kolej !!!`);
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({key: 'TURN', value: turn}));
            }
        });
    }

    function sendReadyToStartSignal() {
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({key: 'READY_TO_START', value: turn}));
            }
        });
    }

    function messageHandler(symbol) {
        return (message) => {
            if (message === 'RESET_GAME') {
                gameState.fill(null);
                turn='X';
                sendState(gameState);
                sendCurrentTurn();

            } else {
                let object = JSON.parse(message);
                if (typeof object === 'object') {
                    if (turn === symbol && object.key === 'CHOICE') {
                        gameState[object.value - 1] = symbol;
                        turn = turn === 'X' ? 'O' : 'X'
                        sendCurrentTurn();
                    } else if (turn !== symbol && object.key == 'CHOICE') {
                        sendMessages('MESSAGE', `TERAZ Player ${turn}.\n Poczekaj na swoją kolej ${symbol} !!!`);
                    }
                    sendState(gameState);
                } else {
                    sendMessages('MESSAGE', message);
                }
            }
        };
    }

    socketClient.on('close', (socketClient) => {
        if (playerX && socketClient === playerX._closeCode) {
            playerX = undefined;
            sendMessages("PlayerX opuscił grę");
        } else if (playerO && socketClient === playerO._closeCode) {
            playerO = undefined;
            sendMessages("PlayerO opuscił grę");
        } else {
            observers.forEach((observer, index) => {
                if (observer && observer._closeCode === socketClient) {
                    observers[index] = undefined;
                }
            })
        }

        console.log('closed');
        console.log('Number of clients: ', socketServer.clients.size);
    });
});