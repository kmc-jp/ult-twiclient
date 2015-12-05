import {getApi} from '../common/oauth';
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

window.addEventListener('load',()=>{
  if(setting.tokens){
    var api = getApi(setting.tokens);
    var params = {screen_name: 'wass80'};
    var ul_tweet = document.getElementById("tweets");
    api.get('statuses/user_timeline', params, function(error, tweets, response){
      if (!error) {
        console.log('tweets',tweets.map((t)=>t.text).join("\n"), tweets);
        tweets.forEach((tweet)=>{
            var t = document.createElement("li");
            t.innerText = tweet.text;
            ul_tweet.appendChild(t);
        });
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
  }else{
    console.warn("did not oauth");
  }
});
