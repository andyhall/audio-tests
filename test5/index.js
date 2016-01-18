/* globals Ractive */

var Player = require('./notePlayer')
var Sequencer = require('./sequencer')



var player = new Player()
var sequencer = new Sequencer(player.context)

var data = {
	playing: false,
	params: [
		{ val: 60, min: 45, max: 75, step: 1, label: 'Base note' },
		{ val: 4, min: 2, max: 8, step: .25, label: 'BPS' },
		{ val: 0.24, min: 0.1, max: 0.5, step: .01, label: 'Quarter note length' },
		{ val: 0.7, min: 0.01, max: 1, step: .01, label: 'melody volume' },
		{ val: 0.5, min: 0.01, max: 1, step: .01, label: 'bass volume' },
		{ val: 0.7, min: 0.01, max: 1, step: .01, label: 'quarter/half odds' },
		{ val: 0.08, min: 0.01, max: 1, step: .01, label: 'stay odds' },
	],
}
function getParam(i) { return data.params[i].val }
sequencer.BPS = getParam(1)


function isChordNote(note, base, chord) {
	for (var i in chord) {
		if ((base+chord[i]-note) % 12 === 0) return true
	}
	return false
}

var chordI = [0, 4, 7, 11]  //   I  chord
var chordii = [2, 5, 9, 12] //  ii chord

var melodyGen = (function () {
	var time = 0 // quarter notes
	var note = getParam(0)
	return function () {
		var measure = Math.floor(time/4)
		var even = measure % 2
		var chord = (even === 0) ? chordI : chordii
		var diff = (Math.random() > 0.5) ? 1 : -1
		if (note>80) diff = -1
		if (note<43) diff = 1
		if (Math.random() > getParam(6)) note += diff
		var base = getParam(0)
		while(!isChordNote(note, base, chord)) note += diff
		var ret = { time: time, data: note }
		time += (Math.random() < getParam(5)) ? 1 : 2
		return ret
	}
})()
var noteConsumer = function (data, wait) {
	player.playNote(data, wait, getParam(2), getParam(3))
}

var bassChordGen = (function () {
	var measure = 0
	return function () {
		var even = measure % 2
		var chord = (even === 0) ? chordI : chordii
		var ret = { time: measure*4, data: chord }
		measure++
		return ret
	}
})()
var chordConsumer = function (data, wait) {
	var base = getParam(0) - 24
	for (var i in data) {
		player.playNote(base+data[i], wait, 4*getParam(2), getParam(4))
	}
}


sequencer.addTrack(melodyGen, noteConsumer)
sequencer.addTrack(bassChordGen, chordConsumer)



function togglePlaying() {
	if (data.playing) {
		sequencer.start()
	} else {
		sequencer.stop()
	}
}

function handleParams() {
	sequencer.BPS = getParam(1)
}



/******************** UI ********************/


var ractive = new Ractive({
	el: '#ui',
	template: '#template',
	data: data
})
window.ractive = ractive


ractive.on({
	'play': function () {
		ractive.toggle('playing')
		togglePlaying()
	},
	'param-change': function () { handleParams() },
})








