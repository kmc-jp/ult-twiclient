import {getApi} from '../common/oauth';
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

function tiwdom(tweet){
  var t = document.createElement("li");
  t.innerText = tweet.text + "♥x" + tweet.favorite_count;
  return t;
}
window.addEventListener('load',()=>{
  if(setting.tokens){
    var api = getApi(setting.tokens);
    var params = {screen_name: 'wass80'};
    var ul_tweet = document.getElementById("tweets");
    api.get('statuses/home_timeline', params, function(error, tweets, response){
      if (!error) {
        console.log('tweets',tweets.map((t)=>t.text).join("\n"), tweets);
        tweets.forEach((tweet)=>{
            ul_tweet.appendChild(tiwdom(tweet));
        });
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
    var inp_submitbox = document.getElementById("submitbox");
    var btn_submitbtn = document.getElementById("submitbtn");
    var btn_streambtn = document.getElementById("streambtn");
    btn_submitbtn.addEventListener('click',()=>{
      console.info(inp_submitbox.value);
      api.post('statuses/update', {
          status: inp_submitbox.value
        },(error, tweet, response)=>{
        if (!error) {
          console.log(tweet, response);
        } else {
          console.log('error', error.map((e)=>e.message).join("\n"),  error);
        }
      });
    });
    btn_streambtn.addEventListener('click',()=>{
      console.info("start streaming");
      api.stream('user', {}, (stream)=>{
        stream.on('data', (tweet)=>{
          console.log(tweet);
          ul_tweet.appendChild(tiwdom(tweet));
        });
      });
    });
  }else{
    console.warn("did not oauth");
  }
});
