import {getOauthUrl, getTokens, getApi} from '../common/oauth';

window.addEventListener('load', main);

function main(){
  getOauthUrl().then(
    (url)=>{
      console.log('resolve',url);
      const oauthWin = document.getElementById('oauthWin');
      oauthWin.src = url;
      oauthWin.addEventListener('did-finish-load', ()=>{
        console.log(oauthWin.getURL());
        var matchData;
        if(matchData = oauthWin.getURL().match(/oauth_verifier=(.+)/)){
          console.log(matchData[1]);
          getTokens(matchData[1]).then((tokens)=>{
            var setting = {
              tokens
            };
            localStorage["ulttwiclient"] = JSON.stringify(setting);
            console.log(getApi(tokens));
          });
        }
      });
    },
    (reason)=>{console.error('cannot get Oauth url error', reason);}
  )
}
