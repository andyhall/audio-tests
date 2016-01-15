/* globals Ractive */

if (!window.AudioContext) throw new Error("Browser doesn't support WebAudio")
// var Ractive = require('ractive')


var context = new AudioContext()
var nodes = []

var gainer = context.createGain()
gainer.gain.value = 1
gainer.connect(context.destination)
var output = gainer


function startStop(start) {
	if (start) {
		for (var i = 0; i < 1; i++) makeGenerator(freq)
	} else {
		while (nodes.length) nodes.pop().disconnect()
	}
}


var data = {
	playing: false,
	params: [
		{ val: 0.5, min: 0, max: 1, step: .01, label: 'Gain' },
		{ val: 440, min: 100, max: 1000, step: 1, label: 'Freq' },
		// { val: 300, min: 100, max: 1000, step: 20, label: 'freq' },
		// { val: 50, min: 0, max: 200, step: 1, label: 'Q' },
	],
}


var freq
function handleParams(arr) {
	gainer.gain.value = arr[0]
	freq = arr[1]
}







var filter


function makeGenerator(frequency) {
	console.log(frequency)
	var len = 2048
	var impulseLen = 0.001 * context.sampleRate
	var impulse = impulseLen
	var guitar = context.createScriptProcessor(len, 0, 1)
	var samples = Math.round(context.sampleRate / frequency)
	var y = new Float32Array(samples)
	var n = 0
	var repeat = 25
	guitar.onaudioprocess = function (e) {
		if (--repeat < 0) {
			repeat = 25
			impulse = impulseLen
		}
		var output = e.outputBuffer.getChannelData(0);
		for (var i = 0; i < e.outputBuffer.length; ++i) {
			var xn = (--impulse >= 0) ? .5 - Math.random() : 0
			output[i] = y[n] = xn + (y[n] + y[(n + 1) % samples]) / 2;
			if (++n >= samples) n = 0;
		}
	}
	

	// var noise = context.createBufferSource()
	// noise.buffer = noiseBuffer
	// noise.loop = true
	// noise.start()

	// var f = context.createBiquadFilter()
	// f.type = 'lowpass'
	// f.frequency.value = freq
	// f.Q.value = 80

	guitar.connect(output)
	// f.connect(output)

	nodes.push(guitar)
	// nodes.push(f)
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
ractive.on('param-change', function () {
	setParams()
})
function setParams() {
	var ps = ractive.get('params')
	var ret = []
	for (var i in ps) { ret.push(ps[i].val) }
	handleParams(ret)
}
setParams()





