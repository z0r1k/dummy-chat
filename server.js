const io = require('socket.io')();

io.on('connection', (client) => {
    client.on('new-chat', (message) => {
        console.log('>>> msg', message);
        io.emit('new-chat', message);
    });
});

io.serveClient(false);
io.listen(8000);