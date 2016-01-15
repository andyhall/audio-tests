
module.exports = Sequencer

function Sequencer(context) {
	this.noteGenerator = null
	this.noteConsumer = null
	this.lookAhead = 0.2 // sec
	
	var self = this
	var running = false
	var offset = 0.0
	var nextNote
	
	var RAF = function () {
		var songtime = context.currentTime - offset
		while (nextNote.time <= songtime+self.lookAhead) {
			var wait = nextNote.time - songtime
			self.noteConsumer(nextNote.data, wait)
			nextNote = self.noteGenerator()
		}
		if (running) requestAnimationFrame(RAF)
	}
	
	this.start = function () {
		offset = context.currentTime
		if (nextNote) {
			offset -= nextNote.time
		} else {
			nextNote = self.noteGenerator()
		}
		running = true
		RAF()
	}
	
	this.stop = function () {
		running = false
	}
}



