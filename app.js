
const KEYBOARD = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "/"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "?"],
];

const KOCH_ORDER = ['K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
    'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', ',',
    'V', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8',
    'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X']

const KEY_OFFSET = 20;
const KEY_HEIGHT = 50;


const KEY_ACTIVE = "#fa9f1f";
const KEY_INACTIVE = "#666";

if(!localStorage.getItem('level')){
    var level = 1;
    localStorage.setItem('level', level);
} else {
    var level = parseInt(localStorage.getItem('level'));
}

const ROUNDS = 10;
var round = 0;
var correct = 0;

var current_keyboard = KOCH_ORDER.slice(0, level + 1);

var morse = new MorseCodec();
var morsePlayer = new MorseCodePlayer(55);

/** Web Audio API Analyser - related variables */
var bufferLength = _analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");
var keyInventory = [];    

function init() {

    // Redraw the game board on window resize
    window.addEventListener('resize', redraw, false);
    redraw();

    // Find the letter clicked
    canvas.addEventListener('click', function(event) {
        let x = event.pageX,
            y = event.pageY;

        let found = keyInventory.find(function(element) {
            return (y > element.top && y < element.top + element.height 
                && x > element.left && x < element.left + element.width
                && element.color == KEY_ACTIVE);
        });

        if (found != null) {
            guess(found.label);
        }

    }, false);

    // Find the letter typed
    document.addEventListener('keydown', function(event) {
        let char = event.key.toUpperCase();

        let found = keyInventory.find(function(element) {
            return (element.label == char && element.color == KEY_ACTIVE);
        });

        if (found != null) {
            guess(found.label);
        }

    }, false);

    play();
}

var timeoutHandle;
var current_letter;

function play() {
    if (round == ROUNDS) {
        if ((correct / ROUNDS) >= 0.9) {
            levelUp();
        } else if ((correct / ROUNDS) <= 0.6) {
            levelUp(-1);
        }

        round = 0;
        correct = 0;
    }

    round++;

    if (round == 1) {
        current_letter = current_keyboard[current_keyboard.length - 1];
    } else {
        current_letter = current_keyboard[Math.floor(Math.random()*current_keyboard.length)];
    }

    playLetter();
    
    redraw();
}

function guess(letter){
    clearTimeout(timeoutHandle);

    if (letter == current_letter){
        correct++;
    }

    play();
}

function playLetter() {
    clearTimeout(timeoutHandle);
    morsePlayer.playText(current_letter);
    timeoutHandle = setTimeout(playLetter, 3000);
}

function levelUp(increment = 1) {
    level = level + increment;
    localStorage.setItem('level', level);
    current_keyboard = KOCH_ORDER.slice(0, level + 1);
    redraw();
}

function createKeys() {
    keyInventory.length = 0;

    let width = (window.innerWidth - KEY_OFFSET) / KEYBOARD[0].length - KEY_OFFSET;
    let height = KEY_HEIGHT;
    
    let top = window.innerHeight - (KEYBOARD.length * (height + KEY_OFFSET) + KEY_OFFSET);

    for(let i = 0; i < KEYBOARD.length; i++) {
        let row = KEYBOARD[i];

        let row_length = row.length * (width + KEY_OFFSET);
        if (row.length <= 7){
            row_length = row_length + width + KEY_OFFSET;
        }

        let left = (window.innerWidth - row_length) / 2 + KEY_OFFSET / 2;

        for(let i = 0; i < row.length; i++) {
            let letter = row[i];

            let color = KEY_INACTIVE;

            if (current_keyboard.includes(letter)) {
                color = KEY_ACTIVE;
                console.log(letter);
            }

            let key = {
                "label": letter,
                "color": color,
                "left": left,
                "top": top,
                "width": width,
                "height": height,
            }
            keyInventory.push(key);

            left = left + width + KEY_OFFSET;
        }

        top = top + height + KEY_OFFSET;
    }
}

function redraw() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    //console.log(window.innerWidth, window.innerHeight, canvas.width, canvas.height);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    createKeys();

    ctx.lineWidth = '2';
    ctx.textAlign = "center";

    ctx.fillStyle = KEY_ACTIVE;
    ctx.font = "64pt Courier New";
        ctx.fillText(
            correct + " / " + round + " / " + ROUNDS,
            window.innerWidth / 2,
            128,
        );

    keyInventory.forEach(function(element) {
        ctx.strokeStyle = element.color;
        ctx.fillStyle = element.color;
        
        ctx.beginPath();
        ctx.rect(element.left, element.top, element.width, element.height);
        ctx.stroke();
        ctx.closePath();

        ctx.font = "24px Courier New";
        ctx.fillText(
            element.label,
            element.left + element.width / 2,
            element.top + 24,
        );

        ctx.font = "12px Courier New";
        ctx.fillText(
            morse.ALPHABET[element.label.toLowerCase()],
            element.left + element.width / 2,
            element.top + 40,
        );
    });
}

(function() {init();})();