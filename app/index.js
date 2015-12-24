import {getApi} from '../common/oauth';
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

function createTweetDom(tweet, api){
  var dom_tweet = document.createElement("li");
  var profile_image = document.createElement("img");
  var dom_user_name = document.createElement("div");
  var text_tweet = document.createElement("span");
  var favorite_marker = document.createElement("span");

  profile_image.setAttribute("class", "user_icon");
  profile_image.setAttribute("src", tweet.user.profile_image_url);
  dom_user_name.textContent = tweet.user.name + " @" + tweet.user.screen_name;
  text_tweet.textContent = tweet.text;
  favorite_marker.textContent = (tweet.favorited ? "🍣" : "🍚") + tweet.favorite_count;
  favorite_marker.addEventListener('click', ()=>{
      console.log(tweet.id_str);
      var favorites_url = tweet.favorited ? 'favorites/destroy' : 'favorites/create';
    api.post(favorites_url, {id: tweet.id_str}, (error, _tweet, response)=>{
      if (!error) {
        console.log(_tweet, response);
        tweet.favorited = !tweet.favorited;
        favorite_marker.textContent = (_tweet.favorited ? "🍣" : "🍚") + (_tweet.favorite_count);
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
  });

  dom_tweet.appendChild(profile_image);
  dom_tweet.appendChild(dom_user_name);
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
          inp_submitbox.value = "";
        } else {
          console.log('error', error.map((e)=>e.message).join("\n"),  error);
        }
      });
    });
    btn_streambtn.addEventListener('click',()=>{
      console.info("start streaming");
      api.stream('user', {}, (stream)=>{
        stream.on('data', (tweet)=>{
          if (!tweet.friends) {
            console.log(tweet);
            ul_tweet.insertBefore(createTweetDom(tweet, api), ul_tweet.firstChild);
          }
        });
      });
    });
    btn_streambtn.click();
  }else{
    console.warn("did not oauth");
  }
});
