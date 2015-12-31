import {getApi} from '../common/oauth';
const remote = require('electron').remote;
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

function showImage(url, size) {
  var dom_body = document.getElementsByTagName("body")[0];
  var dom_image_view = document.createElement("div");
  dom_image_view.id = "image_view";
  var dom_image = document.createElement("img");
  dom_image.setAttribute("src", url);
  dom_image.setAttribute("width", size.w);
  dom_image.setAttribute("height", size.h);
  dom_image_view.appendChild(dom_image);
  dom_image_view.addEventListener('click', ()=>{
    dom_image_view.parentNode.removeChild(dom_image_view);
    dom_image_view.removeEventListener('click');
  });
  dom_body.appendChild(dom_image_view);
}

function createTweetDom(tweet, api){
  var dom_tweet = document.createElement("li");
  var div_profile_image = document.createElement("div");
  var profile_image = document.createElement("img");
  var dom_user_name = document.createElement("div");
  var text_tweet = document.createElement("span");
  var favorite_marker = document.createElement("span");
  var dom_thumbnails = document.createElement("div");

  if (tweet.retweeted_status) {
    let retweeted_status = tweet.retweeted_status;
    dom_tweet.classList.add('retweeted_status');
    profile_image.setAttribute("src", retweeted_status.user.profile_image_url);
    dom_user_name.textContent = retweeted_status.user.name + " @" + retweeted_status.user.screen_name;
    text_tweet.textContent = retweeted_status.text;
    favorite_marker.textContent = (retweeted_status.favorited ? "🍣" : "🍚") + retweeted_status.favorite_count;
  } else {
    profile_image.setAttribute("src", tweet.user.profile_image_url);
    dom_user_name.textContent = tweet.user.name + " @" + tweet.user.screen_name;
    text_tweet.textContent = tweet.text;
    favorite_marker.textContent = (tweet.favorited ? "🍣" : "🍚") + tweet.favorite_count;
  }
  div_profile_image.setAttribute("class", "user_icon");
  div_profile_image.appendChild(profile_image);
  tweet.entities.urls.forEach((url)=>{
    text_tweet.textContent = text_tweet.textContent.replace(url.url, url.display_url);
  });
  if (tweet.entities.media) {
    dom_tweet.classList.add("with_photo_thumbnails");
    tweet.extended_entities.media.forEach((m)=>{
      if (m.type === "photo") {
        let thumbnail = document.createElement("img");
        thumbnail.setAttribute("src", m.media_url);
        thumbnail.classList.add("photo_thumbnail");
        thumbnail.addEventListener('click', ()=>{
          showImage(m.media_url, m.sizes.small);
        });
        dom_thumbnails.appendChild(thumbnail);
      }
    });
  }
  favorite_marker.addEventListener('click', ()=>{
    console.log(tweet.id_str);
    var favorites_url = tweet.favorited ? 'favorites/destroy' : 'favorites/create';
    var favorites_id = tweet.retweeted_status ? tweet.retweeted_status.id_str : tweet.id_str
    api.post(favorites_url, {id: favorites_id}, (error, _tweet, response)=>{
      if (!error) {
        console.log(_tweet, response);
        tweet.favorited = !tweet.favorited;
        favorite_marker.textContent = (_tweet.favorited ? "🍣" : "🍚") + (_tweet.favorite_count);
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
  });
  profile_image.addEventListener('click', (evt)=>{
    console.log(tweet.id_str);
    document.getElementById("in_reply_to_status_id").value = tweet.id_str;
    let submit_box = document.getElementById("submitbox");
    submit_box.value = "@" + tweet.user.screen_name + " "
    submit_box.focus();
  });

  dom_tweet.appendChild(div_profile_image);
  dom_tweet.appendChild(dom_user_name);
  dom_tweet.appendChild(text_tweet);
  dom_tweet.appendChild(favorite_marker);
  if (tweet.retweeted_status) {
    let dom_retweeted = document.createElement("div");
    dom_retweeted.setAttribute("class", "retweeted_by")
    dom_retweeted.textContent = "retweeted by @" + tweet.user.screen_name;
    dom_tweet.appendChild(dom_retweeted);
  }
  dom_tweet.appendChild(dom_thumbnails);
  return dom_tweet;
}

function createNotification(title, body, icon, kind) {
  let notifier = document.getElementById("notifier");
  let notification = document.createElement("div");
  notification.classList.add('notification');
  notification.classList.add(kind);
  notification.textContent = title + " : " + body;
  notifier.appendChild(notification);
  const removeMSecond = 6000;
  let autoremove = window.setTimeout(()=>{
    notification.removeEventListener('click');
    notification.parentNode.removeChild(notification);
  }, removeMSecond);
  notification.addEventListener('click', ()=>{
    window.clearTimeout(autoremove);
    notification.removeEventListener('click');
    notification.parentNode.removeChild(notification);
  });
  if (!remote.getCurrentWindow().isFocused()) {
    new Notification(title, {icon: icon, body: body});
  }
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
    var btn_clearreplybtn = document.getElementById("clear_reply_btn");
    var in_reply_to_status_id_box = document.getElementById("in_reply_to_status_id");
    var char_counter = document.getElementById("char_counter");
    btn_submitbtn.addEventListener('click',()=>{
      console.info(inp_submitbox.value);
      api.post('statuses/update', {
          status: inp_submitbox.value,
          in_reply_to_status_id: in_reply_to_status_id_box.value
        },(error, tweet, response)=>{
        if (!error) {
          console.log(tweet, response);
          inp_submitbox.value = "";
          in_reply_to_status_id_box.value = "";
        } else {
          console.log('error', error.map((e)=>e.message).join("\n"),  error);
        }
      });
    });
    btn_streambtn.addEventListener('click',()=>{
      console.info("start streaming");
      btn_streambtn.setAttribute('disabled', 'disabled');
      api.stream('user', {}, (stream)=>{
        stream.on('data', (tweet)=>{
          if (!tweet.friends) {
            console.log(tweet);
            ul_tweet.insertBefore(createTweetDom(tweet, api), ul_tweet.firstChild);
          }
        });
        stream.on('favorite', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            createNotification("あなたのツイートがいいねされました", data.target_object.text, data.target.profile_image_url_https, 'favorite');
          }
        });
        stream.on('unfavorite', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            createNotification("あなたのツイートがいいね取り消しされました", data.target_object.text, data.target.profile_image_url_https, 'unfavorite');
          }
        });
        stream.on('follow', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            createNotification(data.source.name + " さんにフォローされました", data.source.description, data.source.profile_image_url_https, 'follow');
          }
        });
        stream.on('list_member_added', (data)=>{
          if (data.target.screen_name === me.screen_name) {
            createNotification(data.source.name + " さんにリスト "+data.target_object.name+" に追加されました", data.target_object.description, data.source.profile_image_url_https, 'list_member_added');
          }
        });
      });
    });
    btn_clearreplybtn.addEventListener('click',()=>{
      inp_submitbox.value = inp_submitbox.value.replace(/@[a-zA-Z0-9_]+/g, '');
      in_reply_to_status_id_box.value = "";
    });
    btn_streambtn.click();
    inp_submitbox.addEventListener('input', ()=>{
      const max_tweet_length = 140;
      let remain = max_tweet_length - inp_submitbox.value.length;
      char_counter.textContent = "残り " + remain + "文字";
      if (remain < 0) {
        btn_submitbtn.disabled = true;
      } else {
        btn_submitbtn.disabled = false;
      }
    });
  }else{
    console.warn("did not oauth");
  }
});
