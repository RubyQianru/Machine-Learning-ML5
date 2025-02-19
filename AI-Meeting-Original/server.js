const fs = require('fs');
				
const express = require('express');
const app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Hello World!')
});

const https = require('https');

const options = {
	key: fs.readFileSync('/etc/letsencrypt/live/qz2432.itp.io/privkey.pem'), 
	cert: fs.readFileSync('/etc/letsencrypt/live/qz2432.itp.io/cert.pem') 
};

const httpServer = https.createServer(options, app);

httpServer.listen(443);

let peers = [];

const io = require('socket.io')(httpServer);

io.sockets.on('connection', 

	function (socket) {
	
		peers.push({socket: socket});
		console.log("We have a new client: " + socket.id + " peers length: " + peers.length);
		
		socket.on('list', function() {
			let ids = [];
			for (let i = 0; i < peers.length; i++) {
				ids.push(peers[i].socket.id);
			}
			console.log("ids length: " + ids.length);
			socket.emit('listresults', ids);			
		});
		
		socket.on('signal', (to, from, data) => {
			console.log("SIGNAL", to, data);
			let found = false;
			for (let i = 0; i < peers.length; i++) {
				console.log(peers[i].socket.id, to);
				if (peers[i].socket.id == to) {
					console.log("Found Peer, sending signal");
					peers[i].socket.emit('signal', to, from, data);
					found = true;
					break;
				}				
			}	
			if (!found) {
				console.log("never found peer");
			}
		});

		socket.on('heart', function(data){
			io.emit('heart', data)
		})

		socket.on('raiseHand', function(data){
			io.emit('raiseHand', data)
		})

		socket.on('yay', function(data){
			io.emit('yay', data)
		})

		socket.on('thumb', function(data){
			io.emit('thumb', data)
		})
		
		socket.on('disconnect', function() {
			console.log("Client has disconnected " + socket.id);
		    io.emit('peer_disconnect', socket.id);
			for (let i = 0; i < peers.length; i++) {
				if (peers[i].socket.id == socket.id) {
					peers.splice(i,1);
				}
			}			
		});
	}
);