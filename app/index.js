import remote from 'remote';
const {getApi} = remote.require('./common/oauth');
var setting = JSON.parse(localStorage["ulttwiclient"]);
console.log(setting.tokens)

if(setting.tokens){
  var api = getApi(setting.tokens);
  var params = {screen_name: 'wass80'};
  api.get('statuses/user_timeline', params, function(error, tweets, response){
    if (!error) {
      console.log('tweets',tweets.map((t)=>t.text).join("\n"), tweets);
    } else {
      console.log('error', error.map((e)=>e.message).join("\n"),  error);
    }
  });
}else{
  console.warn("did not oauth");
}
