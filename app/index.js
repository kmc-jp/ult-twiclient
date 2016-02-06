import {getApi} from '../common/oauth';
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const clipboard = require('electron').clipboard;
const dialog = remote.dialog;
const path = require('path');
const Vue = require('vue');
Vue.config.debug = true;
require('twitter-text');
var setting = JSON.parse(localStorage["ulttwiclient"] || '{}');
console.log(setting.tokens);

function anchorHTML(text, href) {
  return '<a onClick="require(\'shell\').openExternal(\''+href+'\')" class="url">'+text+'</a>'
}

window.addEventListener('load',()=>{
  Vue.filter('expand_url', function (text, entities){
    entities.urls.forEach((url)=>{
      text = text.replace(url.url, anchorHTML(url.display_url, url.expanded_url));
    });
    if (entities.media) {
      entities.media.forEach((m)=>{
        text = text.replace(m.url, anchorHTML(m.display_url, m.expanded_url));
      });
    }
    return text;
  });
  Vue.filter('twemoji', function (text){
    return twemoji.parse(text);
  });
  Vue.filter('html_escape', function (text){
    return text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
  });
  Vue.component('small-tweet', {
    template: '#small-tweet',
    props: {
      tweet: Object,
      replysender: Boolean
    },
    data: function() {
      return {vm}
    }
  });
  Vue.filter('text_content', function (html){
    let dom = document.createElement('div');
    dom.innerHTML = html;
    return dom.firstChild.textContent;
  });
  // context menu on status
  var contextMenuForTweet = Menu.buildFromTemplate([
    {label: "ツイートに返信する", click: ()=>{vm.sendReply(vm.selectedTweet);}},
    {label: "ツイートをふぁぼる", click: ()=>{vm.favoriteTweet(vm.selectedTweet);}},
    {type: 'separator'},
    {label: "ツイートをブラウザで開く", click: ()=>{clipboard.writeText(vm.jumpToTwitterURL(vm.selectedTweet));}},
    {label: "ツイートのURLを取得", click: ()=>{clipboard.writeText(vm.createTwitterURL(vm.selectedTweet));}},
    {label: "ツイートのJSONを取得", click: ()=>{clipboard.writeText(JSON.stringify(vm.selectedTweet));}}
  ]);
  // context menu on image
  var contextMenuForImage = Menu.buildFromTemplate([
    {label: "名前を付けて画像を保存", click: ()=>{vm.saveImage();}}
  ]);
  var vm = new Vue({
    el: "#container",
    data: {
      newTweet: {
        text: "",
        in_reply_to_status_id: ""
      },
      selectedTweet: {},
      sendReplyDestTweet: {},
      me: {},
      streaming: false,
      showingMediaType: '',
      image: {},
      video: {},
      tweets: [],
      notifications: [],
      maxTweetLength: 140,
      borderOfLongTweet: 20,
      nowTime: new Date()
    },
    computed: {
      calculateRemainChar: function() {
        return this.maxTweetLength - twttr.txt.getTweetLength(this.newTweet.text);
      },
      isLongTweet: function() {
        return this.borderOfLongTweet > this.calculateRemainChar;
      },
      isExceededTweet: function() {
        return this.calculateRemainChar < 0;
      }
    },
    methods: {
      addTweet: function (tweet) {
        let _tweet = this.body(tweet);
        if (tweet.user.screen_name == this.me.screen_name && tweet.retweeted_status) {
          _tweet.retweeted = true;
        }
        if (_tweet.in_reply_to_status_id_str) {
          api.get('statuses/show', {id: _tweet.in_reply_to_status_id_str},
            (error, in_reply_to_status, response)=>{
            if (!error){
              _tweet.in_reply_to_status = {};
              Object.assign(_tweet.in_reply_to_status, in_reply_to_status);
              this.insertToTweets(tweet);
            } else {
              console.error(error);
            }
          });
        } else {
          this.insertToTweets(tweet);
        }
      },
      insertToTweets: function (tweet) {
        let i = 0;
        for(;i<this.tweets.length;i++){
          if(this.tweets[i].id<tweet.id)break;
        }
        this.tweets.splice(i,0,tweet);
        const MAX_TWEETS = 300;
        if(this.tweets.length>MAX_TWEETS){
          this.tweets.splice(MAX_TWEETS, this.tweets.length - MAX_TWEETS);
        }
        this.modifyScroll();
      },
      modifyScroll: function () {
        const tweetsDOM = this.$els.tweets;
        const scrollTop = tweetsDOM.scrollTop;
        const topTweetDOM = tweetsDOM.firstElementChild;
        const eps = 2;
        if (!topTweetDOM || scrollTop < eps) {
          return;
        }
        tweetsDOM.scrollTop += topTweetDOM.clientHeight;
      },
      sendTweet: function (params) {
        api.post('statuses/update', {
          status: params.text,
          in_reply_to_status_id: params.in_reply_to_status_id
        }, (error, tweet, response)=>{
          if (error) {
            this.createNotification("ツイートの投稿に失敗しました。", this.newTweet.text, null, 'fail');
            return console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
          console.log(tweet, response);
          this.createNotification("ツイートが投稿されました。", this.newTweet.text, null, 'tweet');
          this.newTweet.text = '';
          this.newTweet.in_reply_to_status_id = '';
          this.sendReplyDestTweet = {};
        });
      },
      clearReply: function () {
        this.newTweet.text = this.newTweet.text.replace(/@[a-zA-Z0-9_]+\s*/g, '');
        this.newTweet.in_reply_to_status_id = '';
        this.sendReplyDestTweet = {};
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
              this.addTweet(data);
              if (this.isMentionsForYou(data)) {
                this.createNotification(data.user.name+" さんからあなた宛のメンションがあります。", data.text, data.user.profile_image_url_https, 'tweet');
              }
            }
          });
          stream.on('favorite', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification("あなたのツイートが "+data.source.name+" にふぁぼられました。", data.target_object.text, data.target.profile_image_url_https, 'favorite');
            }
          });
          stream.on('unfavorite', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification("あなたのツイートが "+data.source.name+" にふぁぼを取り消されました。", data.target_object.text, data.target.profile_image_url_https, 'unfavorite');
            }
          });
          stream.on('follow', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification(data.source.name + " さんにフォローされました。", data.source.description, data.source.profile_image_url_https, 'follow');
            }
          });
          stream.on('list_member_added', (data)=>{
            if (data.target.screen_name === this.me.screen_name) {
              this.createNotification(data.source.name + " さんにリスト "+data.target_object.name+" に追加されました。", data.target_object.description, data.source.profile_image_url_https, 'list_member_added');
            }
          });
        });
      },
      selectTweet: function (tweet) {
        this.selectedTweet = tweet;
      },
      toggleSelectedTweet: function (tweet) {
        if (this.isSelectedTweet(tweet))
          this.selectedTweet = {}
        else
          this.selectTweet(tweet);
      },
      isSelectedTweet: function(tweet) {
        return this.selectedTweet && this.selectedTweet.id_str == tweet.id_str;
      },
      favoriteTweet: function (tweet) {
        console.log(tweet.id_str);
        var favorites_url = tweet.favorited ? 'favorites/destroy' : 'favorites/create';
        var favorites_id = tweet.retweeted_status ? tweet.retweeted_status.id_str : tweet.id_str
        api.post(favorites_url, {id: favorites_id}, (error, _tweet, response)=>{
          if (error) {
            this.createNotification("ツイートのふぁぼに失敗しました。", tweet.text, null, 'fail');
            return console.log('error', error.map((e)=>e.message).join("\n"),  error);
          }
          console.log(_tweet, response);
          if (tweet.favorited)
            this.createNotification("ツイートのふぁぼを取り消しました。", tweet.text, null, 'unfavorite');
          else
            this.createNotification("ツイートをふぁぼりました。", tweet.text, null, 'favorite');
          Object.assign(tweet, _tweet);
        });
      },
      retweetTweet: function (tweet) {
        console.log(tweet.id_str);
        var retweet_url = tweet.retweeted ? 'statuses/destroy' : 'statuses/retweet';
        var retweet_id = tweet.id_str;
        if (tweet.retweeted) {
          api.get('statuses/show', {id: tweet.id_str, include_my_retweet: 1}, (error, _tweet, response)=>{
            retweet_id = _tweet.current_user_retweet.id_str;
            api.post(retweet_url, {id: retweet_id}, (error, _tweet, response)=>{
              if (error) {
                this.createNotification("ツイートをリツイート取り消しできませんでした", tweet.text, null, 'fail');
                console.log('error', error.map((e)=>e.message).join("\n"),  error);
                return;
              }
              console.log(_tweet, response);
              this.createNotification("ツイートをリツイート取り消ししました", tweet.text, null, 'favorite');
              Object.assign(tweet, _tweet.retweeted_status);
            });
          });
        } else {
          api.post(retweet_url, {id: retweet_id}, (error, _tweet, response)=>{
            if (error) {
              this.createNotification("ツイートをリツイートできませんでした", tweet.text, null, 'fail');
              console.log('error', error.map((e)=>e.message).join("\n"),  error);
              return;
            }
            console.log(_tweet, response);
            this.createNotification("ツイートをリツイートしました", tweet.text, null, 'favorite');
            Object.assign(tweet, _tweet.retweeted_status);
          });
        }
      },
      showImage: function(url, size) {
        this.image = {url: url, width: size.w, height: size.h};
        this.showingMediaType = 'photo';
      },
      showVideo: function(url, mimetype) {
        this.video = {url, mimetype};
        this.showingMediaType = 'video';
      },
      showMedia: function(media) {
        if(media.type == 'photo')
          this.showImage(media.media_url, media.sizes.small);
        else {
          media.video_info.variants.some((v) => {
            if (v.content_type == 'video/mp4') {
              this.showVideo(v.url, v.content_type);
              return true;
            }
          });
        }
      },
      closeMedia: function() {
        this.image = {};
        this.video = {};
        this.showingMediaType = '';
      },
      sendReply: function(tweet) {
        console.log(tweet.id_str);
        this.sendReplyDestTweet = tweet;
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
      body: function (tweet){
        return tweet.retweeted_status || tweet;
      },
      createTwitterURL: function (tweet){
        return 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
      },
      jumpToTwitterURL: function (tweet){
        require('shell').openExternal(this.createTwitterURL(tweet));
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
        this.selectTweet(tweet);
        contextMenuForTweet.popup(remote.getCurrentWindow());
      },
      contextMenuOnImage: function() {
        contextMenuForImage.popup(remote.getCurrentWindow());
      },
      saveImage: function() {
        const basename = path.basename(this.image.url);
        const defaultPath = path.dirname(require.main.filename) + basename;
        dialog.showSaveDialog({defaultPath}, (filename)=>{
          require('request')(this.image.url).pipe(require('fs').createWriteStream(filename)).on('close', ()=>{
            this.createNotification('画像の保存に成功しました。', basename, null, 'success');
          });
        });
      },
      detectKeyDown: function(event) {
        if (event.ctrlKey && event.keyIdentifier == "Enter" && document.activeElement == this.$els.submit_box) {
          this.sendTweet(this.newTweet);
        }
      },
      convertTime: function(time) {
        let date = new Date(time);
        let diff = Math.floor((this.nowTime.getTime() - date.getTime()) / 1000);
        if (diff < 60) {
          return diff + "秒";
        } else if (diff < 3600) {
          return Math.floor(diff / 60) + "分";
        } else if (diff < 86400) {
          return Math.floor(diff / 3600) + "時間";
        } else if (diff < 31536000) {
          return Math.floor(diff / 86400) + "日";
        } else {
          return Math.floor(diff / 31536000) + "年";
        }
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
        vm.addTweet(tweet);
      });
    });
    vm.startStreaming();
    window.setInterval(()=>{
      vm.nowTime = new Date();
    }, 1000);
  }else{
    console.warn("did not oauth");
  }
});
