var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'secret' });
var simpleGit = require('simple-git')();
var githubRemote = 'github';
var acquiaRemote = 'acquia'
var master = 'master';

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('error', function (err) {
  console.error('Error:', err.message);
});

handler.on('pull_request', function(event) {
  var pull_request = '+refs/pull/' + event.payload.number + '/merge:'
  // git fetch origin +refs/pull/n/merge:, where n is the pull_request number.
  // This leads to a temporary branch FETCH_HEAD (refs/pull/n/merge -> FETCH_HEAD)
  // git fetch origin +refs/pull/n/merge:.
  simpleGit.fetch(remote, pull_request);
  var featureBranch = event.payload.pull_request.head.ref + '1';
  console.log(featureBranch);

  // git checkout master
  simpleGit.checkoutBranch(featureBranch, 'FETCH_HEAD');
});

handler.on('push', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref);
});
