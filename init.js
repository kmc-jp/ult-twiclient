var path = require('path')
var argv = require('yargs')
  .default('test', false)
  .argv

if (argv.test) {
  require('electron-compile').init()
  var TestApplication = require('electron-jasmine').TestApplication
  new TestApplication({specDirectory: 'spec'})
}
else {
  require('electron-compile').init()
  require('./main')
}