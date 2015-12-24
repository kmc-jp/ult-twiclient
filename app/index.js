import {getApi} from '../common/oauth';
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

function createTweetDom(tweet, api){
  var dom_tweet = document.createElement("li");
  var text_tweet = document.createElement("span");
  var favorite_marker = document.createElement("span");
  
  text_tweet.textContent = tweet.text;
  favorite_marker.textContent = (tweet.favorited ? "♥" : "♡") + tweet.favorite_count;
  favorite_marker.addEventListener('click', ()=>{
      console.log(tweet.id_str);
    api.post('favorites/create', {id: tweet.id_str}, (error, _tweet, response)=>{
      if (!error) {
        console.log(_tweet, response);
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
  });

  dom_tweet.appendChild(text_tweet);
  dom_tweet.appendChild(favorite_marker);
  return dom_tweet;
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
          ul_tweet.appendChild(createTweetDom(tweet, api));
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
        stream.on('data', (data)=>{
          console.log(data);
          if (data.friends) {
            return;
          } else if (data.delete) {
            // status deletion
          } else if (data.scrub_geo) {
            // location deletion
          } else if (data.limit) {
            // limit notices
          } else if (data.status_withheld) {
            // withheld content notices (status)
          } else if (data.user_withheld) {
            // withheld content notices (user)
          } else if (data.disconnect) {
            // disconnect messages
          } else if (data.warning) {
            // stall warnings
          } else if (data.event) {
            // catch some event
          } else {
            // status
            ul_tweet.insertBefore(createTweetDom(data, api), ul_tweet.firstChild);
          }
        });
      });
    });
  }else{
    console.warn("did not oauth");
  }
});
