const path = require('path');
const fs = require('fs')
const https = require('https')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { addStream, getStream} = require('./utils/streams')
const app = express();



const httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname,'ssl','server.crt')),
    key: fs.readFileSync(path.join(__dirname,'ssl','server.key')),
    ca:  fs.readFileSync(path.join(__dirname,'ssl','ca.crt'))
}
const server = https.createServer(httpsOptions,app)
const io = socketio(server)

const port = process.env.PORT || 443;

const staticDirectory = path.join(__dirname, '..', 'public');
app.use(express.static(staticDirectory));

io.on('connection', (socket)=>{
    

    console.log('New Connection!')
    socket.on('join', ({username, room},callback) =>{
        socket.room = room
        const {error, user} = addUser({id: socket.id, username, room})
         
        if(error){
            return callback(error)
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('','Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('',`${user.username} has joined`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
            id:socket.id,
            message:'add'
        })
        callback()
    })
    
    socket.on('dr',()=>{
	    console.log('disconnectreq')
	    socket.disconnect()

    })

    socket.on('sendMessage', (message,callback)=>{
        const user = getUser(socket.id)
        if(!message){
            return;
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id)
        console.log('user disconnected')
        if(user){
            
            io.to(user.room).emit('message', generateMessage('',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                id:socket.id,
                users: getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (location,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,location));
        callback()
    })


    socket.on('sendStream',(blob)=>{
        const stream = getStream(socket.id)
        if(stream){
            return socket.broadcast.to(stream.room).emit('blob',{id:socket.id, blob})
        }
        addStream({id:socket.id, room:socket.room})
        socket.broadcast.to(socket.room).emit('blob',{id:socket.id, blob})
    })
    
})



server.listen(port,'0.0.0.0',() => {
    console.log(`Server is up on port ${port}!`);
});
