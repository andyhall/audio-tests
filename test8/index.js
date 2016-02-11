/* globals Wad, Ractive */

var teoria = require('teoria')
var Player = require('./notePlayer')
var Sequencer = require('./sequencer')
var chords = require('./chords')

var player = new Player()
var sequencer = new Sequencer(player.context)


window.teoria = teoria


// UI slider parameters

var data = {
	playing: false,
	params: [
		{ tag: 'root', val: 64, min: 40, max: 80, step: 1, label: 'Root note', display: displayNote },
		{ tag: 'bps', val: 4, min: 2, max: 8, step: .25, label: 'BPS' },
		{ tag: 'mode', val: 0, label: 'mode', arr: chords.modeNames },
		{ tag: 'prog', val: '1, 1, 5, 5, 4, 4, 6, 5 \n 1, 2, 1/1, 2/1, 1, 2, 1/1, 2/1', label: 'Progression', type: 'area', display: displayProg },
		{ tag: 'c/nc', val: 0.5, min: 0, max: 1, step: .01, label: 'CT ↔ NCT' },
		{ tag: 'qlen', val: 0.24, min: 0.1, max: 0.5, step: .01, label: 'note length' },
		{ tag: 'swng', val: 0, min: 0, max: 0.75, step: .05, label: 'swing' },
		{ tag: 'mvol', val: 0.6, min: 0, max: 1, step: .01, label: 'melody vol' },
		{ tag: 'bvol', val: 0.4, min: 0, max: 1, step: .01, label: 'bass vol' },
		{ tag: 'hf/q', val: 0.75, min: 0, max: 1, step: .01, label: 'half ↔ quarter' },
		{ tag: 's/mv', val: 0.95, min: 0, max: 1, step: .01, label: 'stay ↔ move' },
		// { tag: 'chrd', val: 'Cmaj7', label: 'chord' , invalid:false},
		// { tag: 'prog', val: 0, label: 'progression', arr: chords.progressionNames },
	],
	recalculate: 0,
}
function displayNote(n) {
	return n + ' - ' + teoria.Note.fromMIDI(n).toString()
}
var progressionDisplay = ''
function displayProg(str) {
	var unused = this.get('recalculate') // hack to get binding to recalculate
	return progressionDisplay
	unused // no longer unused lol
}


initUIData()





/**
 * 
 * 			Song generators
 * 
 */


// chord/note variables set from UI

var progression // array of chords (arrays of midi numbers)
var scaleTones // array of tones in overall root/scale




function onParameterChange() {
	sequencer.BPS = getParam('bps')
	// construct chords info
	var root = teoria.Note.fromMIDI(getParam('root'))
	var modeName = chords.modeNames[getParam('mode')]
	var scale = root.scale(modeName).notes()
	scaleTones = scale.map(noteToMIDI)
	// resolve progression list and chords therein
	var resolved = resolveProgression(scale)
	ractive.set('params.4.invalid', !resolved)
	ractive.toggle('recalculate')
}

function resolveProgression(scale) {
	var prog = []
	var progStr = ''
	var lines = getParam('prog').split(/[\n\r]+/g)
	lines = lines.filter(function (line) { return (line.charAt(0) !== '#') })
	for (var j in lines) {
		var arr = lines[j].split(',')
		for (var i in arr) {
			var res = /^\s*(\d)([^\s\/]*)\s*(\/[12])?\s*$/.exec(arr[i])
			if (!res) return false
			var num = parseInt(res[1]) - 1 // 0-indexed
			var name, notes
			if (res[2] === '') {
				notes = createModeChord(scaleTones, num)
				if (!notes) return null
				name = guessChordName(notes)
			} else {
				// explicit modifier
				var chord = tryChord(scale[num], res[2])
				if (!chord) return null
				notes = chord.notes().map(noteToMIDI)
				name = chord.toString()
			}
			// map down base notes
			for (var i in notes) notes[i] -= 12
			// inversion
			if (res[3]) {
				var inv = parseInt(res[3].charAt(1))
				if (isNaN(inv) || inv<1 || inv>2) return null
				while (inv>0) {
					notes.push( notes.shift() + 12 )
					inv--
				}
			}
			prog.push(notes)
			progStr += name + ', '
		}
		if (j < lines.length - 1) progStr += '<br>'
	}
	if (prog.length===0) return null
	progression = prog
	progressionDisplay = progStr
	window.prog = progression
	window.scale = scaleTones
	return true
}


// HELPERS

function noteToMIDI(note) { return note.midi() }

function tryChord(note, str) {
	var chord = null
	try { chord = note.chord(str) } catch (e) { }
	return chord
}

function createModeChord(scale, num, str) {
	if (isNaN(num) || num < 0 || num >= scale.length) return null
	var ret = []
	ret.push(scale[(num + 0) % scale.length])
	ret.push(scale[(num + 2) % scale.length])
	ret.push(scale[(num + 4) % scale.length])
	return ret
}

function guessChordName(notes) {
	var raw = notes.map(function (n) { return (n < notes[0]) ? n + 12 : n })
	var str = raw.join()
	var root = teoria.note.fromMIDI(notes[0])
	var names = ['', 'm', '+', 'dim']
	for (var i in names) {
		var chord = root.chord(names[i])
		if (chord.notes().map(noteToMIDI).join() === str) return chord.toString()
	}
	return root.name() + '?'
}






function noteInArray(note, arr) {
	for (var i in arr) { if ((arr[i] - note) % 12 === 0) return true }
	return false
}
function noteClashes(note, chord) {
	for (var i in chord) {
		var diff = Math.abs(chord[i] - note) % 12
		if (diff === 1 || diff === 11) return true
	}
	return false
}

// +       +     +
// C # D # E F # G # A # B C # D # E F # G # A # B C 

var melodyGen = (function () {
	var time = 0 // quarter notes
	var note = 60
	var lastdir = 1
	return function () {
		var root = getParam('root')
		var bar = Math.floor(time / 4)
		var beat = time % 4
		var chord = progression[bar % progression.length]
		// modulate note - pick a direction to move the note
		var dir = (Math.random() < 0.7) ? lastdir : -lastdir
		var dist = Math.pow(Math.abs(root + 6 - note) / 15, 3)
		if (Math.random() < dist) dir = (note > root) ? -1 : 1
		lastdir = dir
		note += (Math.random() > getParam('s/mv')) ? 0 : dir
		// create next note and other parameters
		var len = 1
		var vol = 1
		var swing = getParam('swng')
		var swungtime = time
		var noteArr
		if (beat % 2 === 0) {
			// 1 and 3 beats
			// noteArr = chord
			noteArr = (Math.random() > getParam('c/nc')) ? chord : scaleTones
			len = (Math.random() < getParam('hf/q')) ? 1 : 2
			vol = 1 + swing
		} else {
			noteArr = (Math.random() > getParam('c/nc')) ? chord : scaleTones
			vol = 1 - swing
			swungtime += swing
		}
		// iterate to next note, given constraints
		while (!noteInArray(note, noteArr) || noteClashes(note, chord)) note += dir
		var ret = { time: swungtime, data: { note: note, len: len, vol: vol } }
		time += len
		return ret
	}
})()

var noteConsumer = function (data, wait) {
	playNoteWrapper(data.note, wait, data.len * getParam('qlen'), data.vol * getParam('mvol'))
	// console.log('melody note: ' + data.note)
	debug = data.note
}
var debug = 2


var bassChordGen = (function () {
	var bar = 0
	return function () {
		var chord = progression[bar % progression.length]
		var ret = { time: bar * 4, data: {notes:chord, len:4}  }
		bar++
		return ret
	}
})()
var bassArpeggioGen = (function () {
	var time = 0
	return function () {
		var bar = Math.floor(time / 4)
		var beat = time % 4
		var chord = progression[bar % progression.length]
		var notes = [chord[[0,1,2,1][beat]]]
		var ret = { time: time, data: {notes:notes, len:1}  }
		time++
		return ret
	}
})()
var chordConsumer = function (data, wait) {
	for (var i in data.notes) {
		var note = data.notes[i]
		// localize chord notes to within [-6..+5] of bass center
		// note = (note + 6) % 12 + bass - 6
		// console.log(data[i],'around',bass,'  ->  ', note)
		playNoteWrapper(note, wait, data.len * getParam('qlen'), getParam('bvol'))
	}
	// console.log('base + melody: ' + data + '  ' + debug, debug-data[0])
}

function playNoteWrapper(note, wait, len, vol) {
	// convert note number to frequency
	var fq = teoria.note.fromMIDI(note).fq()
	player.playNote(fq, wait, len, vol)
	// console.log('played freq: ' + fq)
}





sequencer.addTrack(melodyGen, noteConsumer)
sequencer.addTrack(bassChordGen, chordConsumer)







/******************** UI ********************/

var tags

function initUIData() {
	tags = {}
	data.params.forEach(function (p) {
		if (p.arr) {
			p.min = 0
			p.max = p.arr.length - 1
			p.step = 1
			p.display = function (i) { return p.arr[i] }
		}
		tags[p.tag] = p
	})
}
function getParam(tag) {
	return tags[tag].val
}

var ractive = new Ractive({
	el: '#ui',
	template: '#template',
	data: data
})
window.ractive = ractive


ractive.on({
	'play': function () {
		ractive.toggle('playing')
		; (data.playing ? sequencer.start : sequencer.stop)()
	},
	'param-change': function () { onParameterChange() },
})
onParameterChange()







