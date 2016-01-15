/* globals Wad */

module.exports = Player

function Player() {
	this.sound = new Wad({
		source: 'triangle',
		env: {
			attack: .01,
			decay: .005,
			sustain: .9,
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
			attack: 1,
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
	this.context = Wad.audioContext
}



function note2freq(num) {
	return Wad.pitches[Wad.pitchesArray[num]]
}

Player.prototype.playNote = function(note, wait, length){
	wait = wait || 0
	length = length || 0.85
	var pitch = note2freq(note)
	this.compressor.play({
		pitch: pitch,
		wait: wait,
		env: {
			hold: length * .4,
			release: length * .6,
		},
	})
}






