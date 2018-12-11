var follow = require('follow');
var config = require('./config')
var opts = {}; // Same options paramters as before
var feed = new follow.Feed(opts);

// You can also set values directly.
feed.db            = config.couch_url;
feed.since         = 3;
feed.heartbeat     = 30    * 1000
feed.inactivity_ms = 86400 * 1000;

// feed.filter = function(doc, req) {
//   // req.query is the parameters from the _changes request and also feed.query_params.
//   console.log('Filtering for query: ' + JSON.stringify(req.query));
//
//   if(doc.stinky || doc.ugly)
//     return false;
//   return true;
// }

feed.on('start', function(x){
  console.log('starting')
})

feed.on('confirm', function(data){
  console.log(data)
})

feed.on('change', function(change) {
  console.log(change)
  console.log('Doc ' + change.id + ' in change ' + change.seq + ' is neither stinky nor ugly.');
})

feed.on('error', function(er) {
  console.error('Since Follow always retries on errors, this must be serious');
  throw er;
})

feed.follow();
