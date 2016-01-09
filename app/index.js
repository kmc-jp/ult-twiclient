import {getApi} from '../common/oauth';
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const clipboard = require('electron').clipboard;
const Vue = require('vue');
var setting = JSON.parse(localStorage["ulttwiclient"] || '{}');
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
  // context menu on status
  var contextMenuForTweet = Menu.buildFromTemplate([
    {label: "ツイートに返信する", click: ()=>{vm.sendReply(vm.selectedTweet);}},
    {label: "ツイートをふぁぼる", click: ()=>{vm.favoriteTweet(vm.selectedTweet);}},
    {type: 'separator'},
    {label: "ツイートのJSONを取得", click: ()=>{clipboard.writeText(JSON.stringify(vm.selectedTweet));}}
  ]);
  var vm = new Vue({
    el: "#container",
    data: {
      newTweet: {
        text: "",
        in_reply_to_status_id: ""
      },
      selectedTweet: {},
      me: {},
      streaming: false,
      showingImage: false,
      image: {},
      tweets: [],
      notifications: []
    },
    computed: {
      calculateRemainChar: function() {
        return 140 - this.newTweet.text.length;
      }
    },
    methods: {
      sendTweet: function (params) {
        api.post('statuses/update', {
          status: params.text,
          in_reply_to_status_id: params.in_reply_to_status_id
        }, (error, tweet, response)=>{
          if (error) {
            this.createNotification("ツイートの投稿に失敗しました", this.newTweet.text, null, 'fail');
            return console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
          console.log(tweet, response);
          this.createNotification("ツイートが投稿されました", this.newTweet.text, null, 'tweet');
          this.newTweet.text = '';
          this.newTweet.in_reply_to_status_id = '';
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
              this.deleteTweet(data.delete.status.id_str);
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
              if (this.isMentionsForYou(data)) {
                this.createNotification("あなた宛のメンションがあります", data.text, data.user.profile_image_url_https, 'tweet');
              }
            }
          });
          stream.on('favorite', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification("あなたのツイートがいいねされました", data.target_object.text, data.target.profile_image_url_https, 'favorite');
            }
          });
          stream.on('unfavorite', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification("あなたのツイートがいいね取り消しされました", data.target_object.text, data.target.profile_image_url_https, 'unfavorite');
            }
          });
          stream.on('follow', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification(data.source.name + " さんにフォローされました", data.source.description, data.source.profile_image_url_https, 'follow');
            }
          });
          stream.on('list_member_added', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
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
          if (error) {
            this.createNotification("ツイートをいいねできませんでした", tweet.text, null, 'fail');
            return console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
          console.log(_tweet, response);
          if (tweet.favorited)
            this.createNotification("ツイートをいいね取り消ししました", tweet.text, null, 'unfavorite');
          else
            this.createNotification("ツイートをいいねしました", tweet.text, null, 'favorite');
          tweet.favorited = _tweet.favorited;
          tweet.favotite_count = _tweet.favorite_count;
        });
      },
      showImage: function(url, size) {
        this.image = {url: url, width: size.w, height: size.h};
        this.showingImage = true;
      },
      closeImage: function() {
        this.image = {};
        this.showingImage = false;
      },
      sendReply: function(tweet) {
        console.log(tweet.id_str);
        this.newTweet.text = "@" + tweet.user.screen_name + " ";
        this.newTweet.in_reply_to_status_id = tweet.id_str;
        this.$els.submit_box.focus();
      },
      hasMedias: function(tweet) {
        return 'extended_entities' in tweet && 'media' in tweet.extended_entities;
      },
      isMentionsForYou: function(tweet) {
        return tweet.text.match('@' + this.me.screen_name) && !tweet.retweeted_status;
      },
      deleteTweet: function(id_str) {
        this.tweets.forEach((t,i) => {
          if (t.id_str === id_str)
            this.tweets.splice(i, 1);
        })
      },
      createNotification: function(title, body, icon, kind) {
        let notification = {title, body, kind};
        this.notifications.push(notification);
        const removeMSecond = 6000;
        window.setTimeout(()=>{
          this.removeNotification(notification);
        }, removeMSecond);
        if (!remote.getCurrentWindow().isFocused()) {
          new Notification(title, {icon: icon, body: body});
        }
      },
      removeNotification: function(notification) {
        this.notifications.forEach((n,i) => {
          if (n === notification)
            this.notifications.splice(i, 1);
        })
      },
      contextMenuOnTweet: function(tweet) {
        this.selectedTweet = tweet;
        contextMenuForTweet.popup(remote.getCurrentWindow());
      }
    }
  });
  if(setting.tokens){
    var api = getApi(setting.tokens);
    api.get('account/verify_credentials', {}, (error, data, response)=>{
      if (error) {
        return console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
      vm.me = data;
    });
    api.get('statuses/home_timeline', {count: 200}, function(error, tweets, response){
      if (error) {
        console.log('error', error.map((e)=>e.message).join("\n"),  error);
      }
      console.log('tweets',tweets.map((t)=>t.text).join("\n"), tweets);
      tweets.forEach((tweet)=>{
        vm.tweets.push(tweet);
      });
    });
    vm.startStreaming();
  }else{
    console.warn("did not oauth");
  }
});
