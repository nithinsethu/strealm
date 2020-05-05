const generateMessage = (username,text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime()
  };
};

const generateLocationMessage = (username,location) =>{
    return {
        username,
        location: 'https://google.com/maps?q='+location.lat+','+location.long,
        createdAt: new Date().getTime()
    }
}


module.exports = {generateMessage, generateLocationMessage}
