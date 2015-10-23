import Oauth from 'node-twitter-api';
import Twitter from 'twitter';

const consumerKey = "STEtjjUGjw5bhdCjE1bdRxMh3",
   consumerSecret = "B3mvDiqXsCp8xkoi4Fa8WlIKqzNA2mePSic5BSP0kBGW3SdmLj";

const oauth = new Oauth({
    consumerKey,
    consumerSecret,
    callback: 'oob'
});

console.log("saitama");
var requestToken, requestTokenSecret;
export default {getOauthUrl, getApi};
function getOauthUrl(){
  console.log("getOauth");
  return new Promise((resolve, reject)=>{
    oauth.getRequestToken((error, _requestToken, _requestTokenSecret, results)=>{
      if (error) {
        console.error("Error getting OAuth request token : " + error);
        reject(error);
      } else {
        requestToken = _requestToken;
        requestTokenSecret = _requestTokenSecret;
        resolve(oauth.getAuthUrl(_requestToken));
      }
    });
  });
};
function getApi(oauth_verifier){
  console.log("getApi");
  return new Promise((resolve, reject)=>{
  oauth.getAccessToken(requestToken, requestTokenSecret, oauth_verifier,
    (error, accessToken, accessTokenSecret, results)=>{
      console.log("getAccessToken");
      if (error) {
        console.error("Error accessToken", error);
        reject("error accessToken: "+error);
      } else {
          console.log("verifyCredentials");
        oauth.verifyCredentials(accessToken, accessTokenSecret,
          (error, data, response)=>{
            if (error) {
              console.error("Error Credentials", error);
              reject("error Credentials: "+error);
            } else {
              console.log(accessToken, accessTokenSecret);
              console.log(data["screen_name"]);
              var config = {
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                access_token_key: accessToken,
                access_token_secret: accessTokenSecret
              };
              resolve(new Twitter(config));
            }
          }
        );
      }
    });
  });
};
