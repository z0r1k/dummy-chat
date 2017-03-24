const io = require('socket.io')();

io.on('connection', (client) => {
    client.on('new-chat', (message) => {
        io.emit('new-chat', message);
    });
});

io.serveClient(false);
io.listen(8000);