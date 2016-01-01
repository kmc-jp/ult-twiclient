import {getApi} from '../common/oauth';
const remote = require('electron').remote;
const Vue = require('vue');
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens);

window.addEventListener('load',()=>{
  Vue.filter('expand_url', function (text, entities){
    entities.urls.forEach((url)=>{
      text = text.replace(url.url, url.display_url);
    });
    if (entities.media) {
      entities.media.forEach((m)=>{
        text = text.replace(m.url, m.display_url);
      });
    }
    return text;
  });
  var vm = new Vue({
    el: "#container",
    data: {
      newTweet: {
        text: "",
        in_reply_to_status_id: ""
      },
      streaming: false,
      tweets: [],
      notifications: []
    },
    methods: {
      sendTweet: function (params) {
        api.post('statuses/update', {
          status: params.text,
          in_reply_to_status_id: params.in_reply_to_status_id
        }, (error, tweet, response)=>{
          if (!error) {
            console.log(tweet, response);
            this.newTweet.text = '';
            this.newTweet.in_reply_to_status_id = '';
          } else {
            console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
        });
      },
      clearReply: function () {
        this.newTweet.text = this.newTweet.text.replace(/@[a-zA-Z0-9_]+/g, '');
        this.newTweet.in_reply_to_status_id = '';
      },
      startStreaming: function () {
        console.info("start streaming");
        this.streaming = true;
        api.stream('user', {}, (stream)=>{
          stream.on('data', (data)=>{
            console.log(data);
            if (data.friends) {
              return;
            } else if (data.delete) {
              console.log(data.delete);
              this.deleteTweet(data.delete.id_str);
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
              this.tweets.push(data);
            }
          });
          stream.on('favorite', (data)=>{
            if (data.target.screen_name === me.screen_name) {
              this.createNotification("あなたのツイートがいいねされました", data.target_object.text, data.target.profile_image_url_https, 'favorite');
            }
          });
          stream.on('unfavorite', (data)=>{
            if (data.target.screen_name === me.screen_name) {
              this.createNotification("あなたのツイートがいいね取り消しされました", data.target_object.text, data.target.profile_image_url_https, 'unfavorite');
            }
          });
          stream.on('follow', (data)=>{
            if (data.target.screen_name === me.screen_name) {
              this.createNotification(data.source.name + " さんにフォローされました", data.source.description, data.source.profile_image_url_https, 'follow');
            }
          });
          stream.on('list_member_added', (data)=>{
            if (data.target.screen_name === me.screen_name) {
              this.createNotification(data.source.name + " さんにリスト "+data.target_object.name+" に追加されました", data.target_object.description, data.source.profile_image_url_https, 'list_member_added');
            }
          });
        });
      },
      favoriteTweet: function (tweet) {
        console.log(tweet.id_str);
        var favorites_url = tweet.favorited ? 'favorites/destroy' : 'favorites/create';
        var favorites_id = tweet.retweeted_status ? tweet.retweeted_status.id_str : tweet.id_str
        api.post(favorites_url, {id: favorites_id}, (error, _tweet, response)=>{
          if (!error) {
            console.log(_tweet, response);
            tweet = _tweet;
          } else {
            console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
        });
      },
      showImage: function(url, size) {
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
      },
      sendReply: function(tweet) {
        console.log(tweet.id_str);
        let submit_box = document.getElementById("submitbox");
        this.newTweet.text = "@" + tweet.user.screen_name + " ";
        this.newTweet.in_reply_to_status_id = tweet.id_str;
        this.$$.submit_box.focus();
      },
      hasMedias: function(tweet) {
        return 'extended_entities' in tweet && 'media' in tweet.extended_entities;
      },
      deleteTweet: function(id_str) {
        this.tweets.forEach(function(t,i) {
          if (t.id_str === id_str)
            this.tweets.splice(i, 1);
        })
      },
      createNotification: function(title, body, icon, kind) {
        let notification = {title, body, kind};
        this.notifications.add(notification);
        const removeMSecond = 6000;
        window.setTimeout(()=>{
          removeNotification(notification);
        }, removeMSecond);
        if (!remote.getCurrentWindow().isFocused()) {
          new Notification(title, {icon: icon, body: body});
        }
      },
      removeNotification: function(notification) {
        this.notifications.forEach(function(n,i) {
          if (n === notification)
            this.notifications.splice(i, 1);
        })
      }
    }
  });
  if(setting.tokens){
    var api = getApi(setting.tokens);
    var me;
    api.get('account/verify_credentials', {}, (error, data, response)=>{
      if (!error) {
        me = data;
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
    });
    api.get('statuses/home_timeline', {count: 200}, function(error, tweets, response){
      if (!error) {
        console.log('tweets',tweets.map((t)=>t.text).join("\n"), tweets);
        tweets.forEach((tweet)=>{
          vm.tweets.push(tweet);
        });
      } else {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
      vm.startStreaming();
    });
  }else{
    console.warn("did not oauth");
  }
});
