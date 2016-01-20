/* globals Wad, Ractive */

var Player = require('./notePlayer')
var Sequencer = require('./sequencer')
var chords = require('./chords')

var player = new Player()
var sequencer = new Sequencer(player.context)





// UI slider parameters

var data = {
	playing: false,
	params: [
		{ tag: 'root', val: 60, min: 50, max: 70, step: 1, label: 'Root note', display: displayChord },
		{ tag: 'bass', val: 48, min: 40, max: 65, step: 1, label: 'Bass center', display: displayChord },
		{ tag: 'bps',  val: 4, min: 2, max: 8, step: .25, label: 'BPS' },
		{ tag: 'qlen', val: 0.24, min: 0.1, max: 0.5, step: .01, label: 'note length' },
		{ tag: 'mvol', val: 0.6, min: 0, max: 1, step: .01, label: 'melody vol' },
		{ tag: 'bvol', val: 0.5, min: 0, max: 1, step: .01, label: 'bass vol' },
		{ tag: 'q/hf', val: 0.75, min: 0, max: 1, step: .01, label: 'half/quarter' },
		{ tag: 's/mv', val: 0.08, min: 0, max: 1, step: .01, label: 'stay/move' },
		{ tag: 'c/nc', val: 0.75, min: 0, max: 1, step: .01, label: 'CT/NCT' },
		{ tag: 'mode', val: 0, label: 'mode', arr: chords.modeNames },
		{ tag: 'prog', val: 0, label: 'progression', arr: chords.progressionNames },
	],
}
function displayChord(n) {
	return n + ': ' + Wad.pitchesArray[n]
}
initUIData()





/**
 * 
 * 			Song generators
 * 
 */



function noteInArray(note, arr) {
	for (var i in arr) {
		if ((arr[i]-note) % 12 === 0) return true
	}
	return false
}

var chordName = ''
function setChordVars(bar) {
	var mode = chords.modes[getParam('mode')]
	var prog = chords.progressions[getParam('prog')]
	var chordnum = prog[bar % prog.length]
	chord = chords.getModeChord(getParam('mode'), chordnum, false)
	chordName = chord.join()
	nonChordNotes = []
	mode.forEach(function(n){
		if (chord.indexOf(n)<0) nonChordNotes.push(n)
	})
	if (nonChordNotes.length===0) throw new Error('probably a bug here..')
	window.ct = chord
	window.nct = nonChordNotes
}


var chord, nonChordNotes

var melodyGen = (function () {
	var time = 0 // quarter notes
	var note = 0
	return function () {
		var root = getParam('root')
		var bar = Math.floor(time/4)
		setChordVars(bar)
		// modulate note
		var diff = (Math.random() > 0.5) ? 1 : -1
		if (note > 20) diff = -1
		if (note <-20) diff = 1
		if (Math.random() > getParam('s/mv')) note += diff
		if (Math.random() > getParam('c/nc')) {
			while(!noteInArray(note, chord)) note += diff
		} else {
			while(!noteInArray(note, nonChordNotes)) note += diff
		}
		var ret = { time: time, data: root+note }
		time += (Math.random() < getParam('q/hf')) ? 1 : 2
		return ret
	}
})()
var noteConsumer = function (data, wait) {
	player.playNote(data, wait, getParam('qlen'), getParam('mvol'))
}

var bassChordGen = (function () {
	var bar = 0
	return function () {
		setChordVars(bar)
		// localize chord notes to within [-6..+5] of bass center
		var root = getParam('root')
		var bassCenter = getParam('bass')
		for (var i in chord) {
			chord[i] = (chord[i] + root + 6 - bassCenter) % 12 + bassCenter - 6
		}
		var ret = { time: bar*4, data: chord }
		bar++
		return ret
	}
})()
var chordConsumer = function (data, wait) {
	// var s = 'Playing: ' + chordName + ' \t['
	for (var i in data) {
		player.playNote(data[i], wait, 4*getParam('qlen'), getParam('bvol'))
		// s += Wad.pitchesArray[data[i]] + ' '
	}
	// console.log(s+']')
}


sequencer.addTrack(melodyGen, noteConsumer)
sequencer.addTrack(bassChordGen, chordConsumer)



function handleParams() {
	sequencer.BPS = getParam('bps')
}
handleParams()



/******************** UI ********************/

var tags

function initUIData() {
	tags = {}
	data.params.forEach(function(p){
		if (p.arr) {
			p.min = 0
			p.max = p.arr.length - 1
			p.step = 1
			p.display = function(i) {return p.arr[i]}
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
		;(data.playing ? sequencer.start : sequencer.stop)()
	},
	'param-change': function () { handleParams() },
})








