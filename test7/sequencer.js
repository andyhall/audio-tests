
module.exports = Sequencer

function Sequencer(context) {
	this.noteGenerator = null
	this.noteConsumer = null
	this.lookAhead = 1 // sec
	this.BPS = 4 // notes/sec - scales song's time to realtime
	
	var tracks = []
	this.addTrack = function(generator, consumer) {
		tracks.push({
			gen: generator,
			con: consumer,
			next: null
		})
	}
	
	var self = this
	var interval
	var lasttime = 0.0 // actual time (seconds) of previous loop
	var songtime = 0.0 // elapsed time (notes) song has played
	
	var loop = function () {
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
	}
	
	this.start = function () {
		if (typeof interval !== 'undefined') return
		lasttime = context.currentTime
		tracks.forEach(function(track){
			if (!track.next) track.next = track.gen()
		})
		loop()
		interval = setInterval(loop, 30)
	}
	
	this.stop = function () {
		clearInterval(interval)
		interval = undefined
	}
}



