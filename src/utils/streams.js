let streams=[]
const addStream = (stream)=>{
    console.log('stream Added!')
    streams.push(JSON.parse(JSON.stringify(stream)))
    return  stream
};


const getStream =  (id)=>{
    return streams.find((stream)=>stream.id === id)
}


module.exports   = {addStream, getStream}