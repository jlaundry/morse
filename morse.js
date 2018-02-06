
// Based on https://github.com/ar1st0crat/animal-morse-code/blob/master/static/js/morse.js

/** 
 *  Text-to-MorseCode encoder
 *  MorseCode-to-Text decoder
 *  @class
 */
var MorseCodec = function() {
    /** All symbols available for encoding */
    this.ALPHABET = {
        // letters:
        'a': '.-',   'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.',
        'f': '..-.', 'g': '--.',  'h': '....', 'i': '..',  'j': '.---',
        'k': '-.-',  'l': '.-..', 'm': '--',   'n': '-.',  'o': '---',
        'p': '.--.', 'q': '--.-', 'r': '.-.',  's': '...', 't': '-',
        'u': '..-',  'v': '...-', 'w': '.--',  'x': '-..-','y': '-.--',
        'z': '--..',
        // digits:
        '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
        '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
        // misc:
        '.': '.-.-.-', ',': '--..--', '?': '..--..',  '\'': '.----.',
        '/': '-..-.',  '(': '-.--.',  ')': '-.--.-',  '&': '.-...',
        ':': '---...', ';': '-.-.-.', '=': '-...-',   '+': '.-.-.',
        '-': '-....-', '-': '..--.-', '\"': '.-..-.', '$': '...-..-',
        '!': '-.-.--', '@': '.--.-.'
    };
    /** Number of time units between symbols */
    this.SHORT_GAP = 3;
    /** Number of time units between words */
    this.MEDIUM_GAP = 7;
};

/**
 * Encodes text to morse code discarding all spaces
 * @param {string} text - string to encode
 * @return {string} code - Morse code
 */
MorseCodec.prototype.encode = function(text) {
    var cleanText = text.trim().replace(/\s+/, '');
    return [].map.call(cleanText.toLowerCase(),
        function(s) {
            return this.ALPHABET[s];
        }, this)
       .join('');
}

/**
 * Encodes text to morse code 
 * with necessary amount of spaces for correct playback
 * @param {string} text - string to encode
 * @return {string} code - Morse code (with spaces)
 * @example
 *      'hi you' -> '. . . .   . .       - . - -   - - -   . . -'
 *      (3 spaces between symbols and 7 spaces between words)
 */
MorseCodec.prototype.encodeWithSpacing = function(text) {
    var wordGap = Array(this.MEDIUM_GAP + 1).join(' ');
    var symbolGap = Array(this.SHORT_GAP + 1).join(' ');

    var words = text.trim().replace(/\s+/, ' ').split(' ');

    var code = [];
    for (var i = 0; i < words.length; i++) {
        code.push(
            [].map.call(words[i].toLowerCase(),
                function(s) {
                    return this.ALPHABET[s].split('').join(' ');
                }, this)
            .join(symbolGap)
        );
    }
    return code.join(wordGap);
}

/**
 * Decodes text from morse code.
 * Morse code is treated as if it was encoded with spaces!
 * @param {string} code - Morse code to decode
 * @return {string} text - decoded string
 */
MorseCodec.prototype.decode = function(code) {
    var wordGap = Array(this.MEDIUM_GAP + 1).join(' ');
    var symbolGap = Array(this.SHORT_GAP + 1).join(' ');

    var words = code.split(wordGap);
    var decodedWords = [];

    for (var i = 0; i < words.length; i++) {
        var symbols = words[i].split(symbolGap);
        var decoded = '';
        for (var j = 0; j < symbols.length; j++) {
            var code = symbols[j].split(' ').join('');
            var symbol = this.getSymbolByCode(code);
            if (symbol !== undefined) {
                decoded += symbol;
            }
            else {
                return undefined;
            }
        }
        decodedWords.push(decoded);
    }
    return decodedWords.join(' ');
}

/**
 * Given a string of dots and dashes returns the corresponding symbol
 * @param {string} code - Morse code of a symbol
 * @return {string} symbol - symbol in the alphabet or undefined
 */
MorseCodec.prototype.getSymbolByCode = function(code) {
    for (var symbol in this.ALPHABET) {
        if (this.ALPHABET[symbol] === code) {
            return symbol;
        }
    }
}


/** 
 *  Player class based on Web Audio API functions
 *  @class    
 */
var MorseCodePlayer = function(duration = 55, tone = 587) {
    /** Time unit duration in milliseconds */
    this.DOT_DURATION = duration;
    this.DASH_DURATION = this.DOT_DURATION * 3;
    /** Frequency by default is D5 */
    this.TONE = tone;

    var dashBuffer = this.createToneSignal(this.DASH_DURATION, this.TONE);
    this.setDashSound(dashBuffer);
    var dotBuffer = this.createToneSignal(this.DOT_DURATION, this.TONE);
    this.setDotSound(dotBuffer);

    this.isPlaying = false;
};

/**
 * Creates Web Audio API buffer containing one sinusoid 
 * @param {number} len - duration of the sinusoid in msec
 * @param {number} freq - frequency of the sinusoid in Hz
 * @return {AudioBuffer} buffer - resulting buffer with sinusoid
 */
MorseCodePlayer.prototype.createToneSignal = function(len, freq) {
    len *= _context.sampleRate / 1000;
    var buffer = _context.createBuffer(1, len, _context.sampleRate);
    var data = buffer.getChannelData(0);
    var digitalFreq = 0.1;
    if (freq) {
        digitalFreq = 2 * Math.PI * freq / _context.sampleRate;
    }
    for (var i = 0; i < len; i++) {
        data[i] = Math.sin(digitalFreq * i);
    }
    return buffer;
}

MorseCodePlayer.prototype.setDotSound = function(decodedArrayBuffer, obj) {
    var self = obj ? obj : this;
    self.dotSource = _context.createBufferSource();
    self.dotSource.buffer = decodedArrayBuffer;
    self.dotSource.connect(_analyser);
}

MorseCodePlayer.prototype.setDashSound = function(decodedArrayBuffer, obj) {
    var self = obj ? obj : this;
    self.dashSource = _context.createBufferSource();
    self.dashSource.buffer = decodedArrayBuffer;
    self.dashSource.connect(_analyser);
}

MorseCodePlayer.prototype.playText = function(text) {
    this.isPlaying = true;
    this.playSymbol(_morse.encodeWithSpacing(text));
}

MorseCodePlayer.prototype.playSymbol = function(text) {
    if (text.length === 0 || !this.isPlaying) {
        this.stop();
        return;
    }
    pause = this.DOT_DURATION;
    if (text[0] === '.') {
        this.dotSource.start(0);
        this.setDotSound(this.dotSource.buffer);
    }
    else if (text[0] === '-'){
        this.dashSource.start(0);
        this.setDashSound(this.dashSource.buffer);
        pause = this.DASH_DURATION;
    }
    setTimeout(function(self) {
                  self.playSymbol(text.slice(1));
               },
               pause, this);
}

MorseCodePlayer.prototype.stop = function() {
    this.isPlaying = false;
}

var _morse = new MorseCodec();

var _context, _analyser;

// Fix iOS Audio Context by Blake Kus https://gist.github.com/kus/3f01d60569eeadefe3a1
// MIT license
(function() {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	if (window.AudioContext) {
		window.audioContext = new window.AudioContext();
	}
	var fixAudioContext = function (e) {
		if (window.audioContext) {
			// Create empty buffer
			var buffer = window.audioContext.createBuffer(1, 1, 22050);
			var source = window.audioContext.createBufferSource();
			source.buffer = buffer;
			// Connect to output (speakers)
			source.connect(window.audioContext.destination);
			// Play sound
			if (source.start) {
				source.start(0);
			} else if (source.play) {
				source.play(0);
			} else if (source.noteOn) {
				source.noteOn(0);
			}
		}
		// Remove events
		document.removeEventListener('touchstart', fixAudioContext);
		document.removeEventListener('touchend', fixAudioContext);
	};
	// iOS 6-8
	document.addEventListener('touchstart', fixAudioContext);
	// iOS 9
    document.addEventListener('touchend', fixAudioContext);
    
    _context = new AudioContext();

    _analyser = _context.createAnalyser();
    _analyser.connect(_context.destination);
    _analyser.fftSize = 8192;
})();


