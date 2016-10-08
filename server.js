var http = require('http')
var createHandler = require('github-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: 'secret' })
var simpleGit = require('simple-git')()
var remote = 'upstream'
var master = '7.x'

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
  simpleGit.checkout('dev')
  var isMergeable = event.payload.pull_request.mergeable;
  console.log(isMergeable)
  simpleGit.mergeFromTo('FETCH_HEAD', master, ['--no-ff'], function(err) {
    if (err) {
      console.log('Error')
    }
  })
  simpleGit.push(remote, 'dev')
})

handler.on('push', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)
})
