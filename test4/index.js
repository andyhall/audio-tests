/* globals Ractive */

var Player = require('./notePlayer')
var Sequencer = require('./sequencer')


var player = new Player()
var sequencer = new Sequencer(player.context)

var data = {
	playing: false,
	params: [
		{ val: 60, min: 45, max: 75, step: 1, label: 'Base note' },
	],
}
function getParam(i) { return data.params[i].val }


var time = 0
var n = 0
sequencer.noteGenerator = function () {
	var num = [0, 2, 4, 5, 7, 9, 11, 12][n]
	var ret = { time: time, data: num }
	n = (n+1) % 8
	time += .4
	return ret
}
sequencer.noteConsumer = function (data, wait) {
	player.playNote(data + getParam(0), wait, 0.3)
}





function togglePlaying() {
	if (data.playing) {
		sequencer.start()
	} else {
		sequencer.stop()
	}
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
	'param-change': function () { },
})








