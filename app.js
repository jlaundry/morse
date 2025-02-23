
const KEYBOARD = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "/"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
    ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "?"],
];

const KOCH_ORDER = [
    'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
    'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', ',',
    'V', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8',
    'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X'
];

var KEY_OFFSET = 20;
var MORSE_FONT_SIZE = "12px Courier New";
const KEY_HEIGHT = 50;


const KEY_ACTIVE = "#fa9f1f";
const KEY_INACTIVE = "#666";
const KEY_CORRECT = "green";
const KEY_INCORRECT = "red";
const ROUNDS = 12;

var round = 0;
var correct = 0;
var level, current_keyboard;

var morse, morsePlayer;

var canvas = document.getElementById("board");
var ctx = canvas.getContext("2d");
var keyInventory = [];    

function init() {

    morsePlayer = new MorseCodePlayer(55);
    morse = new MorseCodec();

    if(!localStorage.getItem('level')){
        level = 1;
    } else {
        level = parseInt(localStorage.getItem('level'));
    }

    // Sets current level, slices the keyboard
    levelUp(0);

    // Redraw the game board on window resize
    window.addEventListener('resize', redraw, false);
    redraw();

    // Find the letter clicked/touched
    canvas.addEventListener('click', function(event) {
        event.preventDefault();
        onClick(event);
    }, false);

    canvas.addEventListener('touchstart', function(event) {
        event.preventDefault();
        onClick(event);
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

var correct_key, incorrect_key;

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
        // Round 1 always starts with the newest key
        current_letter = current_keyboard[current_keyboard.length - 1];
    } else {
        // Any other round randomly picks from the last 6 letters
        let random_position = current_keyboard.length - Math.floor(Math.random() * Math.min(current_keyboard.length, 6)) - 1;
        current_letter = current_keyboard[random_position];
    }

    setTimeout(playLetter, 1000);
    
    redraw();
}

function onClick(event){
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
}

function guess(letter){
    clearTimeout(timeoutHandle);

    correct_key = current_letter;
    let pause = 0;

    if (letter == current_letter){
        correct++;
    } else {
        incorrect_key = letter;
        pause = 1000;
    }

    redraw();
    setTimeout(play, pause);
}

function playLetter() {
    clearTimeout(timeoutHandle);

    // Reset the red/green highlighting from the previous round
    if (typeof(correct_key) == "string") {
        correct_key = undefined;
        incorrect_key = undefined;
        redraw();
    }
    
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

    if (window.innerWidth < 650){
        KEY_OFFSET = 2;
        MORSE_FONT_SIZE = "8px Courier New";
        ctx.lineWidth = '1';
    } else {
        KEY_OFFSET = 20;
        MORSE_FONT_SIZE = "12px Courier New";
        ctx.lineWidth = '2';
    }

    let width = (window.innerWidth - KEY_OFFSET) / KEYBOARD[0].length - KEY_OFFSET;
    let height = KEY_HEIGHT;
    
    let top = window.innerHeight - (KEYBOARD.length * (height + KEY_OFFSET) + KEY_OFFSET) - 10;

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

            if (letter == correct_key) {
                color = KEY_CORRECT;
            } else if (letter == incorrect_key) {
                color = KEY_INCORRECT;
            } else if (current_keyboard.includes(letter)) {
                color = KEY_ACTIVE;
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
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    createKeys();

    ctx.textAlign = "center";

    ctx.fillStyle = KEY_ACTIVE;
    ctx.font = "48pt Courier New";
        ctx.fillText(
        correct + " / " + ROUNDS,
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

        ctx.font = MORSE_FONT_SIZE;
        ctx.fillText(
            morse.ALPHABET[element.label.toLowerCase()],
            element.left + element.width / 2,
            element.top + 40,
        );
    });
}

(function() {init();})();