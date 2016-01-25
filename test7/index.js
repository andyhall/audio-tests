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
		{ tag: 'bass', val: 60, min: 40, max: 80, step: 1, label: 'Bass center', display: displayNote },
		{ tag: 'bps', val: 4, min: 2, max: 8, step: .25, label: 'BPS' },
		{ tag: 'mode', val: 0, label: 'mode', arr: chords.modeNames },
		{ tag: 'prog', val: '1, 1, 5, 5 \n4, 4, 6m, 5', label: 'Progression', type: 'area', display: displayProg },
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
// var chordTones // array of sets of tones in each chord's root's scale

var noteToMIDI = function (note) { return note.midi() }

function onParameterChange() {
	sequencer.BPS = getParam('bps')
	// construct chords info
	var root = teoria.Note.fromMIDI(getParam('root'))
	// console.log('root: ',root.toString())
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
	// var tones = []
	var progStr = ''
	var arr = getParam('prog').split(/[,\n\r]+/g)
	for (var i in arr) {
		var res = /\s*(\d)(\S*)\s*/.exec(arr[i])
		if (!res) return false
		var num = parseInt(res[1]) - 1 // 0-indexed
		var chord = tryChord(scale[num], res[2])
		if (!chord) return false
		var chordnotes = chord.notes().map(noteToMIDI)
		prog.push(chordnotes)
		if (i > 0 && i % 4 === 0) progStr += '<br>'
		progStr += chord.toString() + ', '
		
		
		
		
		// var scalenotes = chord.root.scale(modeName).notes().map(noteToMIDI)
		// scalenotes = scalenotes.filter(function (n) {
		// 	for (var i in chordnotes) {
		// 		if ((chordnotes[i] - n) % 12 === 0) return false
		// 	}
		// 	var diff = Math.abs((n - chordnotes[0]) % 12)
		// 	return (diff !== 0 && diff !== 1 && diff !== 11)
		// })
		// tones.push(scalenotes)
		
		// console.log('adding', chordnotes, scalenotes)
	}
	// console.log('progression: ', prog.join('   '))
	progression = prog
	// chordTones = tones
	progressionDisplay = progStr
	return true
}

function tryChord(note, str) {
	var chord = null
	try {
		chord = note.chord(str)
	} catch (e) { }
	return chord
}




function noteInArray(note, arr) {
	for (var i in arr) { if ((arr[i] - note) % 12 === 0) return true }
	return false
}
function noteClashes(note, chord) {
	for (var i in chord) {
		var diff = Math.abs(chord[i] - note) % 12
		if (diff===1 || diff===11) return true
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
		// var tones = scaleTones[bar % progression.length]		
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
		if (beat%2 === 0) {
			// 1 and 3 beats
			noteArr = chord
			len = (Math.random() < getParam('hf/q')) ? 1 : 2
			vol = 1 + swing
			swungtime += swing
		} else {
			noteArr = (Math.random() > getParam('c/nc')) ? chord : scaleTones
			vol = 1 - swing
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
}

var bassChordGen = (function () {
	var bar = 0
	return function () {
		var chord = progression[bar % progression.length]
		var ret = { time: bar * 4, data: chord }
		bar++
		return ret
	}
})()
var chordConsumer = function (data, wait) {
	var bass = getParam('bass')
	var out = []
	for (var i in data) {
		// localize chord notes to within [-6..+5] of bass center
		var note = data[i]
		note = (note + 6) % 12 + bass - 6
		// console.log(data[i],'around',bass,'  ->  ', note)
		playNoteWrapper(note, wait, 4 * getParam('qlen'), getParam('bvol'))
		out.push(note)
	}
	// console.log('base chord: ' + out)
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







