
module.exports = Sequencer

function Sequencer(context) {
	this.noteGenerator = null
	this.noteConsumer = null
	this.lookAhead = 0.2 // sec
	this.BPS = 4 // notes/sec - scales song's time to realtime
	
	var tracks = []
	this.addTrack = function(generator, consumer) {
		tracks.push({
			gen: generator,
			con: consumer,
			next: generator()
		})
	}
	
	var self = this
	var running = false
	var lasttime = 0.0 // actual time (seconds) of previous loop
	var songtime = 0.0 // elapsed time (notes) song has played
	
	var RAF = function () {
		var bps = self.BPS
		var curr = context.currentTime
		songtime += (curr - lasttime) * bps
		var lookto = songtime + self.lookAhead * bps
		tracks.forEach(function(track){
			while (track.next.time <= lookto) {
				var wait = (track.next.time - songtime) / bps
				track.con(track.next.data, wait)
				track.next = track.gen()
			}
		})
		lasttime = curr
		if (running) requestAnimationFrame(RAF)
	}
	
	this.start = function () {
		lasttime = context.currentTime
		running = true
		RAF()
	}
	
	this.stop = function () {
		running = false
	}
}



