describe("Basic", function(){
  it("checks whether tweet button is disabled when over 140 characters", function(){
    var tweetBox = document.getElementById('tweet-box');
    var tweetButton = document.getElementById('tweet-button');
    tweetBox.setAttribute('value', 'a'.repeat(141));
    expect(tweetButton.getAttribute('disabled')).toBeTruthy();
  });
});