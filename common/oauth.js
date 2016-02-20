import Oauth from 'node-twitter-api';
import Twitter from 'twitter';

const consumerKey = "STEtjjUGjw5bhdCjE1bdRxMh3";
const consumerSecret = "B3mvDiqXsCp8xkoi4Fa8WlIKqzNA2mePSic5BSP0kBGW3SdmLj";

const oauth = new Oauth({
  consumerKey,
  consumerSecret,
  callback: 'http://twitter.com/'
});

let requestToken, requestTokenSecret;
export default {getOauthUrl, getTokens, getApi};
function getOauthUrl(){
  return new Promise((resolve, reject)=>{
    oauth.getRequestToken((error, _requestToken, _requestTokenSecret)=>{
      if (error) {
        console.error("Error getting OAuth request token",error);
        reject(error);
      } else {
        requestToken = _requestToken;
        requestTokenSecret = _requestTokenSecret;
        resolve(oauth.getAuthUrl(_requestToken));
      }
    });
  });
}
function getTokens(oauth_verifier){
  return new Promise((resolve, reject)=>{
    oauth.getAccessToken(requestToken, requestTokenSecret, oauth_verifier,
      (error, accessToken, accessTokenSecret)=>{
        if (error) {
          reject("error accessToken",error);
        } else {
          oauth.verifyCredentials(accessToken, accessTokenSecret,
            (error, data)=>{
              if (error) {
                reject("error Credentials",error);
              } else {
                console.log(accessToken, accessTokenSecret);
                console.log("verified", data.screen_name);
                const tokens = {
                  consumer_key: consumerKey,
                  consumer_secret: consumerSecret,
                  access_token_key: accessToken,
                  access_token_secret: accessTokenSecret
                };
                resolve(tokens);
              }
            }
          );
        }
      }
    );
  });
}
function getApi(tokens){
  return new Twitter(tokens);
}
