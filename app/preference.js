import {getOauthUrl, getTokens, getApi} from '../common/oauth';

window.addEventListener('load', main);
const localStorageName = "ulttwiclient";

function main(){
  getOauthUrl().then((url)=>{

    const oauthWin = document.getElementById('oauthWin');
    const oauthNotify = document.getElementById('oauthNotify');
    oauthWin.src = url;
    oauthWin.addEventListener('did-finish-load', ()=>{
      console.log(oauthWin.getURL());
      const matchData = oauthWin.getURL().match(/oauth_verifier=(.+)/);

      if(matchData){
        getTokens(matchData[1]).then((tokens)=>{
          const setting = {
            tokens
          };
          localStorage[localStorageName] = JSON.stringify(setting);
          console.log(getApi(tokens));
          oauthNotify.textContent = "successed verify";
        }, (reason)=>{ console.error(reason); });
      }

    });
  },
    (reason)=>{ console.error(reason); }
  );
}
