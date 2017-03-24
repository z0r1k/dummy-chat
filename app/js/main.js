define(['io'], function(io){
   var socket = io('http://localhost:8000');

   var message = {
       user: Math.round(Math.random() * 100 % 100),
       message: 'hello'
   };

   console.log('>>> new-chat', message);
   socket.emit('new-chat', message);

   socket.on('new-chat', console.log.bind(console, '<<< new-chat'));

});