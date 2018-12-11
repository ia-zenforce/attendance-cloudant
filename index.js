var mongoConnectionString = 'mongodb://127.0.0.1/agenda';
var Agenda = require('agenda')
var request = require('superagent')
var async = require('async')
var _ = require('lodash')
var pluckDocuments = require('./utils').pluckDocuments
var config = require('./config')
var db = require('./db')


var apiUrl = config.service_url
var agenda = new Agenda({db: {address: config.mongo_url}});

agenda.define('get locs', function(job, done) {
  async.waterfall([
    function(callback) {
      console.log('requesting token')
      var url= `${apiUrl}/login`;

      request
        .post(url)
        .send({username: 'admin', password: 'admin'})
        .end(function(err, res){
          var token = res.body.access_token
          callback(null, token);
        })
    },
    function(token, callback) {
      console.log('requesting docs')
      db.getDocs(token, callback)
    },
    function(inOrBoth, out, token, callback) {
      console.log('posting in or both')
      var url= `${apiUrl}/attendances/batch`;
      console.log('save data: ', inOrBoth)
      // check if there is inOrBoth, pass on to next function in stack when 0
      if (inOrBoth.length > 0){
        request.post(url)
          .set('x-auth-wf-token', token)
          .send(inOrBoth)
          .end(function(err, response, body){
            if(err) console.log('err: ', err)
            console.log(response.body.data)
            var x = response.body.data || []
            var ids = x.reduce(pluckDocuments, []) || []
            callback(null, ids, out, token)
          })
      } else {
        callback(null, [], out, token)
      }

    },
    function(ids, out, token, callback){
      console.log('putting outs')
      var url = `${apiUrl}/attendances/batch`
      console.log('save data: ', out)
      // check if there is out, pass on to next function in stack when 0
      if (out.length > 0){
        // get the matching attendance_ids for the outs
        async.mapSeries(out, function(o, cb){
          var { task_id, user_id, attendancetype_id } = o
          var newUrl=`${apiUrl}/attendances/attendance_id?user_id=${user_id}&task_id=${task_id}&attendancetype_id=${attendancetype_id}`;
          request.get(newUrl)
            .set('x-auth-wf-token', token)
            .end(function(err, res){
              console.log('attendance_id: ', res.body.data, res)
              cb(null, res.body.data.attendance_id)
            })
        }, function(error, data){
          // data = [84, 98]

          //map the attendance_id to the checkout
          var newOut = out.map(function(o, i){
            return _.extend({}, o, {attendance_id: data[i]})
          });

          console.log('data', newOut)
          // put request to complete attendance entry in SQL
          request.put(url)
            .set('x-auth-wf-token', token)
            .send(newOut)
            .end(function(err, res){
              var outs = res.body.data.reduce(pluckDocuments, []) || []
              var newArr = _.merge(outs, [ids])
              callback(null, newArr)
          });
        })
      } else {
        callback(null, ids)
      }

    },
    function(ids, callback){
      console.log('updating couchdb')
      console.log(ids)
      // clean up couch documents with posted true and attendance id
      db.bulkUpdate(ids, callback)
    }
  ], function (err, result) {

    // end of async
    if(err) console.log('cberr', err)
    console.log('completed')
    done()
  });
});

agenda.define('insert doc', function(job, done) {
  db.insertDoc(done)
});

agenda.on('ready', function() {
  // agenda.every('3 minutes', 'delete old users');
  console.log('agenda ready')

  agenda.every('3 minutes', 'get locs');

  agenda.start();
});
