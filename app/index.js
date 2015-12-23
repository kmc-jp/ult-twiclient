import {getApi} from '../common/oauth';
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

function createTweetDom(tweet, api){
  var dom_tweet = document.createElement("li");
  var text_tweet = document.createElement("span");
  var favorite_marker = document.createElement("span");

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

  dom_tweet.appendChild(text_tweet);
  dom_tweet.appendChild(favorite_marker);
  return dom_tweet;
}
window.addEventListener('load',()=>{
  if(setting.tokens){
    var api = getApi(setting.tokens);
    var params = {screen_name: 'wass80'};
    var ul_tweet = document.getElementById("tweets");
    var me;
    api.get('account/verify_credentials', {}, (error, data, response)=>{
      if (!error) {
        me = data;
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
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
        stream.on('data', (tweet)=>{
          if (!tweet.friends) {
            console.log(tweet);
            ul_tweet.insertBefore(createTweetDom(tweet, api), ul_tweet.firstChild);
          }
        });
        stream.on('favorite', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            var favoriteNotification = new Notification("あなたのツイートがいいねされました", {
              body: data.target_object.text,
              icon: data.target.profile_image_url_https
            });
          }
        });
        stream.on('unfavorite', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            var unfavoriteNotification = new Notification("あなたのツイートがいいね取り消しされました", {
              body: data.target_object.text,
              icon: data.target.profile_image_url_https
            });
          }
        });
        stream.on('follow', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            var followNotification = new Notification(data.source.name + " さんにフォローされました", {
              body: data.source.description,
              icon: data.source.profile_image_url_https
            });
          }
        });
      });
    });
  }else{
    console.warn("did not oauth");
  }
});
