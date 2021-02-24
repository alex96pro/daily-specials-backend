var userSockets = {};
var restaurantSockets = {};

export default function initSockets(socketIO) {
    socketIO.on('connection', (socket) => {
        socket.emit("connection", "send-id-to-server");
        socket.on('send-id', (args) => {
            if(args.userId){
                console.log("konektovan user"+args.userId);
                userSockets[args.userId] = socket.id;
                console.log("user sockets: "+JSON.stringify(userSockets));
                socket.on('user-send-order', (args) => {
                    console.log("saljem porudzbinu sa "+args.userId+" na "+args.restaurantId);
                    socketIO.to(restaurantSockets[args.restaurantId]).emit('new-order', args);
                });
            }else{
                console.log("konektovan restoran"+args.restaurantId);
                restaurantSockets[args.restaurantId] = socket.id;
                console.log("restaurant sockets: "+JSON.stringify(restaurantSockets));
                socket.on('accept-order', (args) => {
                    console.log("porudzbina za "+args.userId+" je prihvacena");
                    socketIO.to(userSockets[args.userId]).emit('order-accepted', args);
                });
                socket.on('reject-order', (args) => {
                    console.log("porudzbina za "+args.userId+" je odbijena");
                    socketIO.to(userSockets[args.userId]).emit('order-rejected', args);
                });
            }
        });
    });
}
