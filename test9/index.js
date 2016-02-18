/* globals Wad, Ractive */

var teoria = require('teoria')
var Player = require('./notePlayer')
var Sequencer = require('./sequencer')
var chords = require('./chords')

var player = new Player()
var sequencer = new Sequencer(player.context)


window.teoria = teoria

var sourceArray = ['none', 'sine', 'square', 'sawtooth', 'triangle', 'noise']
var filterArray = ['none', 'lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass']

// UI slider parameters

var data = {
	playing: false,
	params: [
		{ tag: 'root', val: 60, min: 40, max: 80, step: 1, label: 'root', display: displayNote },
		{ tag: 'bps',  val: 1, min: 0.5, max: 4, step: .25, label: 'BPS' },
		{ tag: 'nlen', val: .9, min: 0.1, max: 2, step: .1, label: 'note length' },
		{ tag: 'vol',  val: 0.5, min: 0, max: 1, step: .01, label: 'volume' },
		{ tag: 'chrd', val: 1, min: 1, max: 4, step: 1, label: 'chord notes' },
		{ hr: true },
		{ tag: 'src', val: 1, label: 'source', arr: sourceArray },
		{ tag: 'attk', val:  .01, min: 0, max: 1, step: .01, label: 'attack' },
		{ tag: 'decy', val: .005, min: 0, max: 1, step: .01, label: 'decay' },
		{ tag: 'sust', val:   .7, min: 0, max: 1, step: .01,  label: 'sustain' },
		{ tag: 'hold', val:  .35, min: 0, max: 1, step: .01, label: 'hold' },
		{ tag: 'rels', val:   .5, min: 0, max: 1, step: .01, label: 'release' },
		{ hr: true },
		{ tag: 'filt', val: 0, label: 'filter', arr: filterArray },
		{ tag: 'filk', val: 0.2, min: 0, max: 1, step: .01, label: 'filter atk' },
		{ tag: 'filq', val: 8, min: 0, max: 100, step: 1, label: 'filter q' },
		{ tag: 'ffq1', val: 600, min: 100, max: 2000, step: 10, label: 'filter freq 1' },
		{ tag: 'ffq2', val: 800, min: 100, max: 2000, step: 10, label: 'filter freq 2' },
		{ hr: true },
		{ tag: 'vshp', val: 0, label: 'vibrato shape', arr: sourceArray },
		{ tag: 'vspd', val: 5, min: 0.1, max: 10, step: .1, label: 'vibrato speed' },
		{ tag: 'vmag', val: 5, min: 0.1, max: 50, step: .1, label: 'vibrato mag.' },
		{ tag: 'vatk', val: 2, min: 0, max: 10, step: .1, label: 'vibrato atk' },
		
		// { tag: 'tshp', val: 0, label: 'tremolo shape', arr: sourceArray },
		// { tag: 'tspd', val: 5, min: 0.1, max: 10, step: .1, label: 'tremolo speed' },
		// { tag: 'tmag', val: 5, min: 0.1, max: 50, step: .1, label: 'tremolo mag.' },
		// { tag: 'tatk', val: 2, min: 0, max: 10, step: .1, label: 'tremolo atk' },
		
		// { tag: 'tun1', val: .3, min: 0, max: 1, step: .1, label: 'chorus intensity' },
		// { tag: 'tun2', val: 4, min: 0.1, max: 8, step: .01, label: 'chorus rate' },
		// { tag: 'tun3', val: 0, min: 0, max: 180, step: 10, label: 'chorus phase' },
		// { tag: 'tun4', val: 0, min: 0, max: 1, step: 1, label: 'chorus bypass' },
		
	],
	recalculate: 0,
	exportStr: ''
}
function displayNote(n) {
	return n + ' - ' + teoria.Note.fromMIDI(n).toString()
}

function onParameterChange() {
	sequencer.BPS = getParam('bps')
	var snd = makeSoundParams()
	var cmp = makeCompParams()
	player.resetParams(snd, cmp)
	ractive.set('exportStr', JSON.stringify(snd))
}



function makeSoundParams() {
	var snd = {
		source: sourceArray[getParam('src')],
		env: {
			attack: 	getParam('attk'),
			decay: 		getParam('decy'),
			sustain: 	getParam('sust'),
			hold: 		getParam('hold'),
			release: 	getParam('rels'),
		}
	}

	var filt = filterArray[getParam('filt')]
	if (filt !== 'none') snd.filter = {
		type: filt,
		frequency: getParam('ffq1'),
		q: getParam('filq'),
		env: {
			attack: getParam('filk'),
			frequency: getParam('ffq2')
		}
	}

	var vibe = filterArray[getParam('vshp')]
	if (vibe !== 'none') snd.vibrato = {
		shape: sourceArray[getParam('vshp')],
		attack: getParam('vatk'),
		speed: getParam('vspd'),
		magnitude: getParam('vmag'),
	}

	return snd
}

function makeCompParams() {
	var cmp = {
		attack: 0.03,
		knee: 24,
		ratio: 12,
		release: .25,
		threshold: -24,
	}
	return cmp
}



initUIData()







/*
 * 			Song generators
 */






var melodyGen = (function () {
	var time = 0
	var offsets = [0, 2, 4, 5, 7, 9, 11, 12]
	return function () {
		var base = getParam('root')
		return {
			data: base + offsets[time % offsets.length],
			time: time++,
		}
	}
})()

var noteConsumer = function (data, wait) {
	var notes = getParam('chrd')
	var len = getParam('nlen')
	for (var i = 0; i < notes; ++i) {
		var note = data + [0, 4, 7, 11][i]
		playNoteWrapper(note, wait, len, getParam('vol'))
	}
}



function playNoteWrapper(note, wait, len, vol) {
	var fq = teoria.note.fromMIDI(note).fq()
	player.playNote(fq, wait, len, vol)
}





sequencer.addTrack(melodyGen, noteConsumer)







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







