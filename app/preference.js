import {getOauthUrl, getTokens, getApi} from '../common/oauth';

window.addEventListener('load', main);

function main(){
  getOauthUrl().then((url)=>{

      const oauthWin = document.getElementById('oauthWin');
            oauthNotify = document.getElementById('oauthNotify');
      oauthWin.src = url;
      oauthWin.addEventListener('did-finish-load', ()=>{
        console.log(oauthWin.getURL());
        var matchData;
        if(matchData = oauthWin.getURL().match(/oauth_verifier=(.+)/)){

          getTokens(matchData[1]).then((tokens)=>{
            var setting = {
              tokens
            };
            localStorage["ulttwiclient"] = JSON.stringify(setting);
            console.log(getApi(tokens));
            oauthNotify.textContent = "successed verify"
          }, (reason)=>{ console.error(reason); });

        }
      });

    }, (reason)=>{ console.error(reason); }
  );
}
