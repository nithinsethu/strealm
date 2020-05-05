const streams = []
const streams2 = []
const addStream = (stream)=>{
    console.log('stream Added!')
    streams.push(JSON.parse(JSON.stringify(stream)))
    streams2.push(JSON.parse(JSON.stringify(stream)))
    return  stream
};
const getStreamsInRoom = (room)=>{
    return streams.find((stream)=>stream.room === room)
}
const getStream =  (id)=>{
    return streams.find((stream)=>stream.id === id)
}

const getBlob =   (id,ind)=>{
    const index = streams.findIndex((stream) => stream.id === id)
    //console.log(ind)
    //console.log(ind)
        if(ind === 0){
            if(streams[index] && streams[index].blobs.length){
            return streams[index].blobs.shift()
            }
            return null
    }
    if(streams2[index] && streams2[index].blobs.length){
        return streams2[index].blobs.shift()
        }
        return null
        

    
}

const updateStream =  (id,blob)=>{
    const index = streams.findIndex((stream) => stream.id === id)
    streams[index].blobs.push(blob)
    //streams2[index].blobs.push(blob)
    
    if(streams2[index].blobs.length>2){
        // console.log(streams2[index].blobs.length)
        // streams2[index].blobs.splice(0,streams2[index].blobs.length-2)
        // //streams2[index].blobs = [...streams[index].blobs]
        // console.log(streams2[index].blobs.length)
        
        
    }
    
    //console.log(streams2[index].blobs)
    
}


module.exports   = {addStream, getStream, updateStream, getBlob, getStreamsInRoom}