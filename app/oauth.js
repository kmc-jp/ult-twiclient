import remote from 'remote';
const BrowserWindow = remote.require('browser-window');
const {getOauthUrl, getTokens, getApi} = remote.require('./common/oauth');

window.addEventListener('load', main);

function main(){
  getOauthUrl().then(
    (url)=>{console.log('resolve',url);

      const pinInput = document.getElementById('oauthPin'),
            pinForm  = document.getElementById('oauthFrom'),
            oauthWin = document.getElementById('oauthWin');

      pinForm.addEventListener('submit', (event)=>{
        event.preventDefault();
        console.info(pinInput.value);
        getTokens(pinInput.value).then((tokens)=>{
            console.info(tokens);
            var setting = {
              tokens
            }
            localStorage["ulttwiclient"] = JSON.stringify(setting);
            console.log(localStorage["tokens"]);
            console.log(getApi(tokens));
        },(reason)=>console.log('on submit',reason));

      })
      oauthWin.src = url;
      //var params = {screen_name: 'ulttwiclient(kari)'};
      // api.get('statuses/user_timeline', params, function(error, tweets, response){
      //   if (!error) {
      //     console.log('tweets',tweets);
      //   } else {
      //     console.log('error', error.map((e)=>e.message).join("\n"),  error);
      //   }
      // });
    },
    (reason)=>{console.error('cannot get Oauth url error', reason);}
  )
}
