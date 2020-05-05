const path = require('path');
const fs = require('fs')
const https = require('https')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { addStream, getStream, updateStream, getBlob, getStreamsInRoom } = require('./utils/streams')
const app = express();
const httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname,'ssl','server.cert')),
    key: fs.readFileSync(path.join(__dirname,'ssl','server.key'))
}
const server = https.createServer(httpsOptions,app)
const io = socketio(server)

const port = process.env.PORT || 80;
let index = 0
let lastReload = new Date().getTime()

const staticDirectory = path.join(__dirname, '..', 'public');
app.use(express.static(staticDirectory));

io.on('connection', (socket)=>{
    
    socket.index = index.valueOf()
    ++index

    console.log('New Connection!')
    socket.on('join', ({username, room},callback) =>{
        socket.room = room
        const {error, user} = addUser({id: socket.id, username, room,index})
        //++index
         
        if(error){
            return callback(error)
        }
        if(new Date().getTime() - lastReload >=1000){
            io.to(user.room).emit('reload')
            lastReload = new Date().getTime()
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


    //push stream
    socket.on('sendStream',(blob)=>{
        const stream = getStream(socket.id)
        if(stream){
            // console.log(getStreamsInRoom(socket.room))
            //updateStream(socket.id,blob)
            return io.to(stream.room).emit('blob',{id:socket.id, blob})
        }
        addStream({id:socket.id, room:socket.room ,blobs:[blob]})
        io.to(socket.room).emit('blob',{id:socket.id, blob})
        
        //console.log(addStream({id:socket.id, mediaElement}))
        //io.emit('streamData',getStream(socket.id))
    })

    socket.on('getBlob',(id,callback)=>{ 
        if(!id){
            id = socket.id
        }
         callback(getBlob(id,socket.index))
    })
    
})



server.listen(port,'0.0.0.0',() => {
    console.log(`Server is up on port ${port}!`);
});
