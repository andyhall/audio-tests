/* globals Wad */

module.exports = Player

function Player() {
	this.context = Wad.audioContext
	this.sound = new Wad({
		source: 'triangle',
		env: {
			attack: .01,
			decay: .005,
			sustain: .7,
			hold: .35,
			release: .5,
		},
		filter: {
			type: 'lowpass',
			frequency: 1200,
			q: 8,
			env: {
				attack: .2,
				frequency: 600
			}
		},
		vibrato: {
			attack: 2,
			speed: 8,
			magnitude: 10
		},
	})
	
	this.compressor = new Wad.Poly({
		compressor: {
			attack: 0.03,
			knee: 30,
			ratio: 12,
			release: .25,
			threshold: -24,
		}
	})
	this.compressor.add(this.sound)
	
	window.sound = this.sound
	window.poly = this.compressor
}




Player.prototype.playNote = function(pitch, wait, length, volume){
	if (volume===0) return
	wait = wait || 0
	length = length || 0.85
	volume = volume || 0.9
	this.compressor.play({
		pitch: pitch,
		volume: volume,
		wait: wait,
		env: {
			// sustain: volume,
			hold: length * .4,
			release: length * .6,
		},
	})
}






