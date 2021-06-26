var firebaseConfig = {
    apiKey: "AIzaSyAc7RTzRAdcyfUT_hf9if91Sgn5_Y96pYU",
    authDomain: "netwalk-4bfd7.firebaseapp.com",
    projectId: "netwalk-4bfd7",
    storageBucket: "netwalk-4bfd7.appspot.com",
    messagingSenderId: "199883579307",
    appId: "1:199883579307:web:70cf17ad5b458497b8fcee",
    measurementId: "G-MSZHD72T16"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

var database = firebase.database();
var leaderboardRef = database.ref("leaderboard");

function saveScore(name, time) {
    var score = database.ref("leaderboard/" + difficulty).push();
    score.set({
        username: name,
        score: time
    });
}

function displayLeaderboard() {
    for (let key in difficulties) {
        let colOffset = (difficulties[key] - 7) * 3 / 4;
        let top10 = database.ref("leaderboard/" + key).orderByChild("score").limitToFirst(10);
        top10.once("value", (snapshot) => {
            let rank = 0;
            snapshot.forEach((child) => {
                let childData = child.val();
                document.getElementById("scores-table").rows[rank + 3].cells[1 + colOffset].innerHTML = childData.username;
                document.getElementById("scores-table").rows[rank + 3].cells[2 + colOffset].innerHTML = childData.score;
                rank++;
            });
        });
    }
}

let helpModal = document.getElementById("helpModal");
let helpBtn = document.getElementById("helpBtn");
let helpClose = document.getElementsByClassName("close")[0];
helpBtn.onclick = function () {
    helpModal.style.display = "block";
};
helpClose.onclick = function () {
    helpModal.style.display = "none";
};

const TILE_WIDTH = 30;
const TILE_HEIGHT = 30;
const difficulties = {
    "easy": 7,
    "medium": 11,
    "hard": 15
};
let ROWS, COLS;

class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.lit = 0;
        if (row === Math.floor(ROWS / 2) && col === Math.floor(COLS / 2)) {
            this.lit = 2;
        }

        //[top,right,bottom,left]
        this.neighbours = new Array(4);
        this.activeEdges = [false, false, false, false];
    }

    getEdgeCount() {
        let count = 0;
        this.activeEdges.forEach((e) => {
            if (e) {
                count++;
            }
        })
        return count;
    }

    rotateClockwise() {
        let temp = this.activeEdges[3];
        for (let i = this.activeEdges.length - 1; i > 0; i--) {
            this.activeEdges[i] = this.activeEdges[i - 1];
        }
        this.activeEdges[0] = temp;
    }

    rotateAnticlockwise() {
        let temp = this.activeEdges[0];
        for (let i = 0; i < this.activeEdges.length - 1; i++) {
            this.activeEdges[i] = this.activeEdges[i + 1];
        }
        this.activeEdges[this.activeEdges.length - 1] = temp;
    }
}

class Tile {
    constructor(node) {
        this.node = node;
        this.rotation = 0;
        this.isLocked = false;

        this.img = undefined;
        let indexSum = 0;
        for (let i = 0; i < 4; i++) {
            if (this.node.activeEdges[i]) {
                indexSum += i;
            }
        }
        switch (node.getEdgeCount()) {
            case 1:
                this.img = headImg;
                for (let i = 0; i < indexSum; i++) {
                    this.rotation = (this.rotation + Math.PI / 2) % (2 * Math.PI);
                }
                break;
            case 2:
                if (indexSum % 2 === 0) {
                    this.img = straightImg;
                    if (indexSum === 4) {
                        this.rotation = (this.rotation + Math.PI / 2) % (2 * Math.PI);
                    }
                } else {
                    this.img = turnImg;
                    if (indexSum === 1) {
                        this.rotation = (this.rotation + Math.PI / 2) % (2 * Math.PI);
                    } else if (indexSum === 3 && this.node.activeEdges[1]) {
                        this.rotation = (this.rotation + Math.PI) % (2 * Math.PI);
                    } else if (indexSum === 5) {
                        this.rotation = (this.rotation + 3 * Math.PI / 2) % (2 * Math.PI);
                    }
                }
                break;
            case 3:
                this.img = threeImg;
                if (indexSum === 3) {
                    this.rotation = (this.rotation + Math.PI / 2) % (2 * Math.PI);
                } else if (indexSum === 6) {
                    this.rotation = (this.rotation + Math.PI) % (2 * Math.PI);
                } else if (indexSum === 5) {
                    this.rotation = (this.rotation + 3 * Math.PI / 2) % (2 * Math.PI);
                }
                break;
        }
    }

    rotateTileClockwise() {
        if (!this.isLocked) {
            this.rotation = (this.rotation + Math.PI / 2) % (2 * Math.PI);
            this.node.rotateClockwise();
            updateLitNodes();
            this.draw();
        }
    }

    rotateTileAnticlockwise() {
        if (!this.isLocked) {
            this.rotation = (this.rotation + 3 * Math.PI / 2) % (2 * Math.PI);
            this.node.rotateAnticlockwise();
            updateLitNodes();
            this.draw();
        }
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        this.draw();
    }

    draw() {
        ctx.setTransform(1, 0, 0, 1, (this.node.col + 0.5) * TILE_WIDTH, (this.node.row + 0.5) * TILE_HEIGHT);
        ctx.clearRect(-TILE_WIDTH / 2, -TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT);
        ctx.rotate(this.rotation);

        if (this.isLocked) {
            ctx.fillStyle = "darkgrey";
            ctx.fillRect(-TILE_WIDTH / 2, -TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT);
        }

        ctx.drawImage(this.img[this.node.lit], -TILE_WIDTH / 2, -TILE_HEIGHT / 2);
    }
}

let canvas, ctx,
    firstSetup = true,
    threeImg = new Array(3), straightImg = new Array(3), turnImg = new Array(3), headImg = new Array(3),
    nodes, litNodes = [], tiles,
    mouseX, mouseY,
    solution, cheated = false,
    lockEngaged = false, currentLock = [],
    timer = null, timeElapsed = 0, timerText,
    difficultyElement, difficulty;

let onClick = function (e) {
    e.preventDefault();

    if (isGameComplete()) {
        return;
    }

    let row = Math.floor(e.offsetY / TILE_HEIGHT);
    let col = Math.floor(e.offsetX / TILE_WIDTH);

    switch (e.button) {
        //left click
        case 0:
            tiles[row][col].rotateTileAnticlockwise();
            if (isGameComplete() && !cheated) {
                showVictoryPrompt();
            }
            break;
        //middle click
        case 1:
            tiles[row][col].toggleLock();
            currentLock.push(tiles[row][col]);
            lockEngaged = true;
            break;
        //right click
        case 2:
            tiles[row][col].rotateTileClockwise();
            if (isGameComplete() && !cheated) {
                showVictoryPrompt();
            }
            break;
    }
}

function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    });
}

function generateRandomSpanningTree() {
    //creating nodes
    nodes = new Array(ROWS);
    for (let i = 0; i < ROWS; i++) {
        nodes[i] = new Array(COLS);
        for (let j = 0; j < COLS; j++) {
            nodes[i][j] = new Node(i, j);
        }
    }

    //assigning neighbours
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            nodes[i][j].neighbours[0] = nodes[(i + ROWS - 1) % ROWS][j];
            nodes[i][j].neighbours[1] = nodes[i][(j + 1) % COLS];
            nodes[i][j].neighbours[2] = nodes[(i + 1) % ROWS][j];
            nodes[i][j].neighbours[3] = nodes[i][(j + COLS - 1) % COLS];
        }
    }

    //creating connections to form a random spanning tree
    let tree = [];
    tree.push(nodes[Math.floor(ROWS / 2)][Math.floor(COLS / 2)]);

    while (tree.length < ROWS * COLS) {
        let n1 = tree[Math.floor(Math.random() * tree.length)];
        if (n1.getEdgeCount() < 3) {
            let edgeIndex = Math.floor(Math.random() * 4);
            let n2 = n1.neighbours[edgeIndex];

            if (!tree.includes(n2)) {
                n1.activeEdges[edgeIndex] = true;
                n2.activeEdges[(edgeIndex + 2) % 4] = true;
                tree.push(n2);
            }
        }
    }

    //storing the solution by creating a copy of the connection states
    solution = [];
    tree.forEach((n) => {
        solution.push([n, n.activeEdges.slice()]);
    })
}

function createTiles() {
    tiles = new Array(ROWS);
    for (let i = 0; i < ROWS; i++) {
        tiles[i] = new Array(COLS);
        for (let j = 0; j < COLS; j++) {
            tiles[i][j] = new Tile(nodes[i][j]);
            tiles[i][j].draw();
        }
    }
}

function scrambleNodes() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let turns = Math.floor(Math.random() * 4);
            for (let k = 0; k < turns; k++) {
                nodes[i][j].rotateClockwise();
            }
        }
    }
}

function showSolution() {
    if (isGameComplete() || solution === undefined) {
        return;
    }
    cheated = true;
    clearInterval(timer);
    timerText.style.visibility = "hidden";
    solution.forEach((arr) => {
        arr[0].activeEdges = arr[1];
    });
    createTiles();
    updateLitNodes();
}

function updateLitNodes() {
    for (let i = 0; i < litNodes.length; i++) {
        litNodes[i].lit = 0;
        tiles[(litNodes[i].row)][(litNodes[i].col)].draw();
    }

    litNodes = [];

    let stack = [];
    let n1 = nodes[Math.floor(ROWS / 2)][Math.floor(COLS / 2)];
    n1.lit = 2;
    litNodes.push(n1);

    for (let i = 0; i < n1.neighbours.length; i++) {
        if (n1.activeEdges[i] && n1.neighbours[i].activeEdges[(i + 2) % 4]) {
            stack.push(n1.neighbours[i]);
        }
    }

    while (stack.length > 0) {
        n1 = stack.pop();
        if (!litNodes.includes(n1)) {
            n1.lit = 1;
            litNodes.push(n1);
        }

        for (let i = 0; i < n1.neighbours.length; i++) {
            if (n1.activeEdges[i] && n1.neighbours[i].activeEdges[(i + 2) % 4] && !litNodes.includes(n1.neighbours[i])) {
                stack.push(n1.neighbours[i]);
            }
        }
    }

    for (let i = 0; i < litNodes.length; i++) {
        tiles[(litNodes[i].row)][(litNodes[i].col)].draw();
    }
}

function isGameComplete() {
    return litNodes.length === ROWS * COLS;
}

function newGame() {
    difficulty = difficultyElement.value;
    ROWS = difficulties[difficulty];
    COLS = ROWS;
    canvas.height = ROWS * TILE_HEIGHT;
    canvas.width = COLS * TILE_WIDTH;

    cheated = false;
    generateRandomSpanningTree();
    scrambleNodes();
    createTiles();
    litNodes = [];
    updateLitNodes();
    if (firstSetup) {
        setupListeners();
    }
    clearInterval(timer);
    startTimer();
}

function setupListeners() {
    canvas.addEventListener("mouseenter", (e) => {
        canvas.focus();
    });
    canvas.addEventListener("mouseout", (e) => {
        resetLock();
        canvas.blur();
    });
    canvas.addEventListener("mousedown", onClick);
    canvas.addEventListener("mouseup", (e) => {
        if (e.button === 1) {
            e.preventDefault();
            resetLock();
        }
    })
    canvas.addEventListener("mousemove", (e) => {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        let row = Math.floor(mouseY / TILE_HEIGHT);
        let col = Math.floor(mouseX / TILE_WIDTH);
        if (!isGameComplete() && lockEngaged && !currentLock.includes(tiles[row][col])) {
            tiles[row][col].toggleLock();
            currentLock.push(tiles[row][col]);
        }
    });
    canvas.addEventListener("keydown", (e) => {
        if (e.key === " ") {
            e.preventDefault();
            if (!isGameComplete() && lockEngaged === false) {
                let row = Math.floor(mouseY / TILE_HEIGHT);
                let col = Math.floor(mouseX / TILE_WIDTH);
                tiles[row][col].toggleLock();
                currentLock.push(tiles[row][col]);
                lockEngaged = true;
            }
        }
    });
    window.addEventListener("keyup", (e) => {
        if (e.key === " ") {
            e.preventDefault();
            resetLock();
        }
    });
    firstSetup = false;
}

function resetLock() {
    lockEngaged = false;
    currentLock = [];
}

function startTimer() {
    timerText.style.visibility = "visible";
    timeElapsed = 0;
    timerText.textContent = "Time elapsed: " + timeElapsed + " seconds";
    timer = setInterval(() => {
        timeElapsed++;
        timerText.textContent = "Time elapsed: " + timeElapsed + " seconds";
    }, 1000)
}

function showVictoryPrompt() {
    let name;
    clearInterval(timer);
    setTimeout(() => {
        name = prompt("Congratulations, you completed the puzzle in " + timeElapsed + " seconds! \nPlease enter your name:");
        if (name === "" || name === null) {
            name = "Anonymous";
        }
        saveScore(name, timeElapsed);
    }, 10);
}


window.onload = async () => {
    canvas = document.getElementById("game-canvas");
    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    }
    canvas.style.background = "lightgrey";
    ctx = canvas.getContext("2d");
    difficultyElement = document.getElementById("difficulty");
    timerText = document.getElementById("timer-text");
    threeImg[0] = await loadTexture("./assets/three.png");
    threeImg[1] = await loadTexture("./assets/threeLit.png");
    threeImg[2] = await loadTexture("./assets/threeSource.png");
    straightImg[0] = await loadTexture("./assets/straight.png");
    straightImg[1] = await loadTexture("./assets/straightLit.png");
    straightImg[2] = await loadTexture("./assets/straightSource.png");
    turnImg[0] = await loadTexture("./assets/turn.png");
    turnImg[1] = await loadTexture("./assets/turnLit.png");
    turnImg[2] = await loadTexture("./assets/turnSource.png");
    headImg[0] = await loadTexture("./assets/head.png");
    headImg[1] = await loadTexture("./assets/headLit.png");
    headImg[2] = await loadTexture("./assets/headSource.png");
    displayLeaderboard();
};