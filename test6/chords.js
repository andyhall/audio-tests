
var modeNames = [
	'Ionian/major',
	'Dorian',
	'Phrygian',
	'Lydian',
	'Mixolydian',
	'Aeolian/natural minor',
	'Locrian',
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


// experimenting
modeNames.push('Harmonic minor')
modes.push([0, 2, 3, 5, 7, 8, 11])

// 1 ♭2 ♭3 4 5 6 ♭7
modeNames.push('Oriental')
modes.push([0, 1, 3, 5, 7, 9, 10])

modeNames.push('Pentatonic major?')
modes.push([0, 2, 4, 4, 7, 9, 9])

modeNames.push('Pentatonic minor?')
modes.push([9, 9, 0, 2, 4, 4, 7])




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
}




