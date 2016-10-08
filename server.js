var http = require('http')
var createHandler = require('github-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: 'secret' })
var simpleGit = require('simple-git')()
var remote = 'origin'
var master = 'master'
var dev = 'dev'

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(7777)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('pull_request', function(event) {
  var pull_request = '+refs/pull/' + event.payload.number + '/merge:'
  simpleGit.fetch(remote, pull_request)
  simpleGit.checkout(master)
  simpleGit.mergeFromTo('FETCH_HEAD', master, ['--no-commit'], function(err) {
    if (!err) {
      console.log('Trying to merge...');
    }
  })
  simpleGit.commit('temp commit', function(err) {
    if (err) {
      console.log('Merge conflict: hard reset...');
      simpleGit.reset(['--hard']);
      console.log("Hard reset to HEAD achieved...");
    }
    else {
      console.log("Good to be merged with dev branch...");
      simpleGit.reset(['--hard']);
      console.log("Hard reset to HEAD achieved...");
      simpleGit.checkout('dev');
      simpleGit.mergeFromTo('FETCH_HEAD', dev, ['--no-ff'], function(err) {
      	if (!err) {
	  simpleGit.pull(remote, dev);
          simpleGit.push(remote, dev);
	}
      });
    }
  });
})

handler.on('push', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)
})
