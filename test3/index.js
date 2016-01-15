/* globals Ractive, Wad */


var data = {
	playing: false,
	params: [
		{ val: 60, min: 45, max: 75, step: 1, label: 'Base note' },
		{ val: 0, min: -1, max: 1, step: .01, label: 'Pan' },
		{ val: 8, min: 0, max: 75, step: .1, label: 'Q' },
		{ val: .35, min: 0, max: 1, step: .01, label: 'env.hold' },
		{ val: .51, min: 0, max: 1, step: .01, label: 'env.release' },
		{ val: 4, min: 0, max: 11, step: 1, label: 'chord offset' },
		{ val: 7, min: 0, max: 11, step: 1, label: 'chord offset' },
		{ val: 0, min: 0, max: 11, step: 1, label: 'chord offset' },
	],
}






function num2freq(num) {
	return Wad.pitches[Wad.pitchesArray[num]]
}

function startStop(playing) {
	var base = data.params[0].val
	playNote(num2freq(base), 0)
	for (var i = 5; i < 8; ++i) {
		var off = data.params[i].val
		if (off) playNote(num2freq(base + off), 0.1 * Math.random())
	}
}

function playNote(pitch, delay) {
	delay = delay || 0
	var sound = new Wad({
		source: 'triangle',
		env: {
			attack: .01,
			decay: .005,
			sustain: .9,
			hold: data.params[3].val,
			release: data.params[4].val
		},
		filter: {
			type: 'lowpass',
			frequency: 1200,
			q: 8.5,
			env: {
				attack: .2,
				frequency: 600
			}
		},
		vibrato: {
			attack: 1,
			speed: 8,
			magnitude: 10
		},
	})

	var compressor

	compressor = new Wad.Poly({
		compressor: {
			attack: 0.03,
			knee: 30,
			ratio: 12,
			release: .25,
			threshold: -24,
		}
	})
	compressor.add(sound)

	var toplay = compressor ? compressor : sound
	toplay.play({
		volume: 1,
		pitch: pitch,
		delay: delay,
		filter: { q: data.params[2].val }
	})

	window.sound = sound
}

function handleParams() {

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







