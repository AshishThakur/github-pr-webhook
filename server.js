var http = require('http');
var createHandler = require('github-webhook-handler');
var handler = createHandler({ path: '/webhook', secret: 'secret' });
var simpleGit = require('simple-git')();
var remote = 'origin';
var master = 'master';
var dev = 'dev';

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
  simpleGit.fetch(remote, pull_request);

  // git checkout master
  simpleGit.checkout(master);
  // Merge the FETCH_HEAD to master branch without committing.
  // git merge --no-commit FETCH_HEAD
  simpleGit.mergeFromTo('FETCH_HEAD', master, ['--no-commit'], function(err) {
    if (!err) {
      console.log('Trying to merge...');
    }
  });

  // Commit. This is a temporary commit to check merge conflicts.
  // git commit -m "temp commit"
  simpleGit.commit('temp commit', function(err) {
    // Merge conflict occured. Reset the merge.
    if (err) {
      console.log('Merge conflict: hard reset initiated...');
      // git reset --hard
      simpleGit.reset(['--hard']);
      console.log("Hard reset to HEAD achieved...");
    }
    // Merge to master branch is successful, hence the FETCH_HEAD can
    // be merged to dev branch successfully. Since merge to master branch
    // was just to check if the conflict arise or not, so merge to master
    // needs to be reset.
    else {
      console.log("Good to be merged with dev branch...");
      // git reset --hard
      simpleGit.reset(['--hard']);
      console.log("Hard reset to HEAD achieved...");
      // git checkout dev
      simpleGit.checkout('dev');
      // git merge --no-ff dev
      simpleGit.mergeFromTo('FETCH_HEAD', dev, ['--no-ff'], function(err) {
      	if (!err) {
	  // git pull origin dev
	  simpleGit.pull(remote, dev);
	  // git push origin dev
          simpleGit.push(remote, dev);
	}
      });
    }
  });
});

handler.on('push', function (event) {
  console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref);
});
