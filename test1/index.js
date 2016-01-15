
if (!window.AudioContext) throw new Error("Browser doesn't support WebAudio")
var Ractive = require('ractive')


var context = new AudioContext()
var nodes = []

var gainer = context.createGain()
gainer.gain.value = 1
gainer.connect(context.destination)
var output = gainer



function startStop(start) {
	if (start) {
		nodes.push(makeGenerator(500))
	} else {
		while (nodes.length) nodes.pop().disconnect()
	}
}


var data = {
	playing: false,
	params: [
		{ val:.5, min: 0, max: 1, step: .05, label: 'Gain' },
		{ val:300, min: 100, max: 1000, step: 20, label: 'freq' },
		{ val:50, min: 0, max: 200, step: 1, label: 'Q' },
	],
}

function handleParams(arr) {
	gainer.gain.value = arr[0]
	if (filter) {
		filter.frequency.value = arr[1]
		filter.Q.value = arr[2]
	}
}



var bufferLen = 1024
var noise = new Float32Array(bufferLen * 2)
for (var i = 0; i < noise.length; i++) {
	noise[i] = Math.random() * 2 - 1
}
function onAudio(e) {
	var num = e.outputBuffer.numberOfChannels
	for (var c = 0; c < num; c++) {
		var buffer = e.outputBuffer.getChannelData(c)
		var offset = (Math.random() * bufferLen) | 0
		for (var i = 0; i < bufferLen; i++) {
			buffer[i] = noise[i + offset]
		}
	}
}

var filter


function makeGenerator(freq) {
	freq = freq || 350
	var node = context.createScriptProcessor(bufferLen, 1, 2)
	node.onaudioprocess = onAudio

	
	
	// var oscillator = context.createOscillator()
	// oscillator.type = 'square'
	// oscillator.frequency.value = 100
	// oscillator.connect(output)
	// oscillator.start()
	// return oscillator

	filter = context.createBiquadFilter();
	filter.type = 'lowpass'

	node.connect(filter)
	filter.connect(output);
	return node
}





/******************** UI ********************/


var ractive = new Ractive({
	el: '#ui',
	template: '#template',
	data: data
})
window.ractive = ractive


ractive.on('start-stop', function () {
	ractive.toggle('playing')
	startStop(ractive.get('playing'))
	setParams()
})
ractive.on('param-change', function() {
	setParams()
})
function setParams() {
	var ps = ractive.get('params')
	var ret = []
	for (var i in ps) { ret.push(ps[i].val) }
	handleParams(ret)
}



