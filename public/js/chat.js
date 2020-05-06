const socket = io();
//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $streams = document.querySelector("#streams");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
const streamTemplate = document.querySelector('#stream-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//Global vars
let mediaSources = []
let sourceBuffers = []
let objectUrls = []
const interval  = 1000
let streamFlag = false
let isFirstCon = true
let selfId = null
let selfMediaSource = null
let mediaRecorder = null
let stream = null
// socket.on("message", (message) => {
//   const html = Mustache.render(messageTemplate, {
//     username: message.username,
//     createdAt: moment(message.createdAt).format("H:mm"),
//     message: message.text
//   });
//   $messages.insertAdjacentHTML("beforeend", html);
// });

// socket.on("locationMessage", (location) => {
//   console.log(location.username)
//   const html = Mustache.render(locationMessageTemplate, {
//     createdAt: moment(location.createdAt).format("H:mm"),
//     location: location.location,
//     username: location.username
//   });
//   $messages.insertAdjacentHTML("beforeend", html);
// });
socket.on('reload',async ()=>restartRecorder())
socket.on('roomData', ({room, users,id,message})=>{
  const html = Mustache.render(sidebarTemplate, {room, users})
  document.querySelector('#sidebar').innerHTML = html;
  if(isFirstCon){
    selfId = id
    users.forEach((user)=>updateMediaSources(user.id,'add'))
    isFirstCon = false
  }
  else{
    updateMediaSources(id,message);
    restartRecorder()
    // restartRecorder()
    // restartRecorder()
    
  }
})

socket.on('blob', ({id,blob})=>{
  appendToSourceBuffer(mediaSources.find((mediaSource)=>mediaSource.id === id),blob)    
})

$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = event.target.elements.message.value;
  $messageFormButton.removeAttribute("disabled");
  $messageFormInput.value = "";
  $messageFormInput.focus();
  socket.emit("sendMessage", message, (error) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message Delivered!");
  });
});

$sendLocationButton.addEventListener("click", (event) => {
  $sendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser!");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      { lat: position.coords.latitude, long: position.coords.longitude },
      (error) => {
        if (error) {
          return console.log(error);
        }
        console.log("Location Shared!");
        $sendLocationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }

});

const restartRecorder = async ()=>{
      await mediaRecorder.stop()
      startRecorder()
      console.log('Restarting recorder')
}

const startRecorder= async ()=>{
    const options = { mimeType: "video/webm; codecs=\"opus,vp8\"", bitsPerSecond: 1000 };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = handleData;
    mediaRecorder.start(interval);
    // setInterval(()=>{
    //   restartRecorder()
    // },1000)
    
}
  constraints = { audio: true, video: true};
  navigator.mediaDevices
  .getUserMedia(constraints)
  .then((_) => {
    stream = _
    startRecorder()
    
    // setInterval(() => {
    //    mediaRecorder.requestData();
    // }, interval);
  })
  .catch((err) => {
  });



//********************************/
  const handleData = async (event) => {
    if (event.data) {
      const blob = event.data
      socket.emit('sendStream',blob)
      const ab = await blob.arrayBuffer()
      //console.log(ab)
      appendToSourceBuffer(selfMediaSource,ab)
      
    }
  };

  

  const updateMediaSources = (id,message)=>{
  if(message === 'add'){
    
    const mediaSource = {id, mediaSource: new MediaSource()}
    mediaSource.url = URL.createObjectURL(mediaSource.mediaSource)
    
    //$streams.src = mediaSource.url
    mediaSource.mediaSource.addEventListener('sourceopen', function(){
    this.addSourceBuffer("video/webm; codecs=\"opus,vp8\"")
    this.sourceBuffers[0].mode = 'sequence'
    //console.log( this.sourceBuffers[0].mode)
    this.sourceBuffers[0].appendWindowStart = 0;
    
    //console.log('end',this.sourceBuffers[0].appendWindowEnd)
    this.addEventListener("updateend", appendToSourceBuffer);
    })
    mediaSource.lastReset = new Date().getTime()
    mediaSources.push(mediaSource)
    const html = Mustache.render(streamTemplate,mediaSource)
    $streams.insertAdjacentHTML("beforeend", html);
    if(id === selfId){
      document.getElementById(selfId).muted = true
      selfMediaSource = mediaSource
    }
    
  }
  else{
    const index = mediaSources.findIndex((mediaSource)=>mediaSource.id === id)
    mediaSources.splice(index,1)
    const videoElement = document.getElementById(id)
    if(videoElement){
      videoElement.pause();
      videoElement.src='';
      videoElement.load();
      videoElement.parentElement.remove();
    }
  }  

}

const streamUpdater = async()=>{
  setInterval(()=>{
    mediaSources.forEach((mediaSource)=>{appendToSourceBuffer(mediaSource)})
    //appendToSourceBuffer(mediaSources[0].mediaSource)
  },interval) 
}

const appendToSourceBuffer = async (mediaSrc,blob)=>{
  // if(!mediaSrc){
  //   mediaSrc = this
  // }
  
  const mediaSource = mediaSrc.mediaSource
  const id = mediaSrc.id

  
  
  const sourceBuffer = mediaSource.sourceBuffers[0]
  
  
  //console.log('haha:',sourceBuffer.timestampOffset)
  const cond = mediaSource.readyState === "open" &&
  sourceBuffer &&
  sourceBuffer.updating === false
  if (
    cond
  ) {
     //console.log(sourceBuffer)
      try{
        if(blob){
          const video = document.getElementById(id)
          sourceBuffer.appendBuffer(blob);
        }
      }
      catch(e){
        console.log(e.toString())
      }
      
    
    
  }
  else{
    console.log('stopped')
    location.reload()
  }
  //const video = document.querySelector('#'+selfId)
//   if (
//     video.buffered.length &&
//     video.buffered.end(0) - video.buffered.start(0) > 10
// )
// {
//     sourceBuffer.remove(0, video.buffered.end(0) - 10)
// }
};

