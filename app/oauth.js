import remote from 'remote';
const BrowserWindow = remote.require('browser-window');
const {getOauthUrl,  getApi} = remote.require('./common/oauth');

window.addEventListener('load', main);

function main(){
  getOauthUrl().then(
    (url)=>{console.log('resolve',url);

      const pinInput = document.getElementById('oauthPin'),
            pinForm  = document.getElementById('oauthFrom'),
            oauthWin = document.getElementById('oauthWin');

      pinForm.addEventListener('submit', ()=>{

        console.info(pinInput.value);
        getApi(pinInput.value).then((api)=>{
            console.info(api);
        },(reason)=>console.log('on submit',reason));
        return false;

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
