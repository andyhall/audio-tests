
var teoria = require('teoria')


// from teoria.Scale.KNOWN_SCALES
var modeNames = [
	'major',
	'minor',
	'harmonicminor',
	'melodicminor',
	'ionian', 
	'dorian',
	'phrygian',
	'lydian',
	'mixolydian',
	'aeolian', 
	'locrian',
	'majorpentatonic',
	'minorpentatonic',
	'chromatic',
	'harmonicchromatic', 
	'blues',
	'doubleharmonic',
	'flamenco',
	'wholetone',
]


var modes = []
modes.push([0, 2, 4, 5, 7, 9, 11]) // ionian
for (var i=1; i<modeNames.length; ++i) {
	modes.push(modes[i-1].slice())
	modes[i].push(modes[i].shift())
	var rem = modes[i][0]
	for (var j=0; j<modes[i].length; ++j) {
		modes[i][j] = (modes[i][j] - rem + 12) % 12
	}
}



var chordNames = [
	'I',
	'II',
	'III',
	'IV',
	'V',
	'VI',
	'VII',
]

var chords = [
	[0, 2, 4],
	[1, 3, 5],
	[2, 4, 6],
	[3, 5, 0],
	[4, 6, 1],
	[5, 0, 2],
	[6, 1, 3],
]



function getModeChord(mode, chord, seventh) {
	var marr = modes[mode]
	var carr = chords[chord]
	var ret = []
	for (var i in carr) {
		ret.push(marr[carr[i]])
	}
	if (seventh) ret.push(marr[(carr[carr.length-1]+2) % marr.length])
	return ret
}


// 1234567
// CDEFGAB


function getChord(offsets, root, center) {
	var chord = offsets.slice()
	for (var i in chord) { chord[i] += root }
	if (center) {
		for (var i in chord) {
			chord[i] = (chord[i] + 6 - center) % 12 + center - 6
		}
	}
	return chord
}


function getChordOffsets(name) {
	var res = /\s*([IiVv]+)(\S)*\s*/.exec(name)
	if (!res) return null
	var n = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 
			 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', ].indexOf(res[1])
	if (n<0) return null
	var degree = (n % 7)
	var minor = (n >= 7) || mod.contains('-')
	var mod = res[2]
	var sev = mod.contains('7')
	// var dom = mod.contains('dom')
	var dim = /(dim|o)/.test(mod)
	var aug = /(aug|\+)/.test(mod)
	if (aug) { minor = false; dim = false }
	if (dim) { minor = true }
	var sharp = mod.contains('#')
	var flat = mod.contains('b')
	var maj7 = mod.contains('M7')
	// build chord
	var root = [0, 2, 4, 5, 7, 9, 11][degree] // Implicit major key?
	root += (sharp ? 1 : 0) + (flat ? -1 : 0)
	var third = root + 4 + (minor ? -1 : 0)
	var fifth = root + 7 + (aug ? 1 : 0) + (dim ? -1 : 0)
	var chord = [root, third, fifth]
	if (sev) {
		var seventh = root + 10 + (maj7 ? 1 : 0) + (dim ? -1 : 0)
		chord.push(seventh)
	}
	return chord
}

function resolveProgression(s) {
	var ret = []
	var arr = s.split(',')
	for (var i=0; i<arr.length; ++i) {
		var c = getChordOffsets(arr[i])
		if (!c) return null
		ret.push(c)
	}
	return ret
}



var progressionNames = [
	[ 1, 2 ],
	[ 1, 5, 6, 4 ],
	[ 1, 2, 4, 5 ],
	[ 1, 4, 2, 5 ],
	[ 1, 2, 5, 1 ],
	[ 1, 4, 5, 1 ],
	[ 1, 6, 4, 5 ],	
	[ 1, 6, 2, 4 ],
	[ 6, 2, 5, 1 ],
	[ 6, 4, 7, 1 ],
]
var progressions = []
progressionNames.forEach(function(p, i) {
	progressions[i] = p.map(function(n){return n-1})
})



/* debug * /
modes.forEach(function(arr,i) {
	var s = ''
	for (var j=modeNames[i].length; j<25; ++j) s += ' '
	console.log(modeNames[i] + s, arr.join())
})
progressionNames.forEach(function(arr) {
	console.log('progression: ', arr.join())
})
/* */


module.exports = {
	modes: modes,
	modeNames: modeNames,
	chordNames: chordNames,
	getModeChord: getModeChord,
	progressions: progressions,
	progressionNames: progressionNames,
	getChord: getChord,
	resolveProgression: resolveProgression,
}




