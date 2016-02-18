/* globals Wad */

module.exports = Player


var soundDefault = {
	source: 'sine',
	env: {
		attack: .01,
		decay: .005,
		sustain: .7,
		hold: .35,
		release: .5,
	},
}

var compressorDefault = {
	attack: 0.03,
	knee: 24,
	ratio: 12,
	release: .25,
	threshold: -24,
}

function Player() {
	this.context = Wad.audioContext
	this.resetParams()
}

function normalizeEnvelope(env, length) {
	var tot = env.attack + env.decay + env.hold + env.release
	var scale = length / tot
	env.attack = env.attack * scale
	env.decay = env.decay * scale
	env.hold = env.hold * scale
	env.release = env.release * scale
}

Player.prototype.resetParams = function (soundParams, compParams, length) {
	var snd = soundParams || soundDefault
	var cmp = compParams || compressorDefault
	var len = length || 1
	normalizeEnvelope(snd.env, len)
	this.sound = new Wad(snd)
	this.compressor = new Wad.Poly({ compressor: cmp })
	this.compressor.add(this.sound)
	window.sound = this.sound
	window.poly = this.compressor
	window.context = this.context
}

Player.prototype.playNote = function (pitch, wait, length, volume) {
	if (volume === 0) return
	wait = wait || 0
	length = length || 0.85
	volume = volume || 0.9
	this.compressor.setVolume(volume)
	this.sound.play({
		pitch: pitch,
		wait: wait,
	})
}






