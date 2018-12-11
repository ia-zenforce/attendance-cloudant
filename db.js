var Cloudant = require("cloudant");
var config = require("./config");
var async = require("async");
var request = require("superagent");
var _ = require("lodash");
var prep = require("./utils").prep;
var me = config.cloudant.username;
var password = config.cloudant.password;

// Initialize the library with my account.
var cloudant = Cloudant({ account: me, password: password });

cloudant.db.list(function(err, allDbs) {
  if (err) console.log(err);
  console.log("All my databases: %s", allDbs.join(", "));
});

var url = "https://zf.zennerslab.com/attendances";
var dbName =
  process.env.NODE_ENV == "development"
    ? config.cloudant.test
    : config.cloudant.staging;

var db = cloudant.db.use("locationtracker", function(err, body, header) {
  if (err) console.log(err);

  console.log(body);
});

// db.insert(
//   { "views":
//     { "by_type_time_location":
//       {
//         "map": function(doc) {
//           if(doc.posted === false){
//             emit(doc)
//           }
//         },
//
//       }
//     }
//   }, '_design/locations2', function (error, response) {
//     if(error) console.log('view error', error)
//     console.log("yay");
//   });

// function view(){
//   console.log('calling view')
//   db.view('locations2', 'by_type_time_location', function(err, body) {
//     if(err) console.log(err)
//     if (!err) {
//       console.log(body)
//       var x = body.rows
//         .map(function(doc) { return doc.key })
//         .reduce(function(a,b){
//           var key = `${b.task_id}-${b.user_id}`
//           a[key] ? a[key].push(b) : a[key] = [b]
//           return a
//         }, {})
//       var inOrBoth = Object.keys(x).map(function(z, i){
//
//         if(x[z][0].type == 'in' || x[z].length > 1)
//             return x[z].reduce(prep, {})
//       })
//       let out = []
//       Object.keys(x).map(function(z, i ){
//         if (x[z].length == 1 && x[z][0].type == 'out')
//           out.push(x[z].reduce(prep, {}))
//       })
//     }
//   });
// }

module.exports = {
  getDocs: function(token, callback) {
    db.view("locations2", "by_type_time_location", function(err, body) {
      if (err) console.log(err);

      if (!err) {
        let inOrBoth = [];
        let out = [];

        var x = body.rows
          .map(function(doc) {
            return doc.key;
          })
          .reduce(function(a, b) {
            var key = `${b.task_id}-${b.user_id}-${b.attendancetype_id}`;
            a[key] ? a[key].push(b) : (a[key] = [b]);
            return a;
          }, {});

        Object.keys(x).forEach(function(z, i) {
          if (x[z][0].type == "in" || x[z].length > 1)
            inOrBoth.push(x[z].reduce(prep, {}));

          if (x[z].length == 1 && x[z][0].type == "out")
            out.push(x[z].reduce(prep, {}));
        });
        // pass control back to async job
        callback(null, inOrBoth, out, token);
      }
    });
  },
  insertDoc: function(done) {
    var created_at = Date.now();
    db.insert({ _id: Date.now(), type: "in", created_at }, function(err, body) {
      if (err) console.log(err);

      console.log(body);
      done();
    });
  },
  bulkUpdate: function(arr, done) {
    async.each(
      arr,
      function(doc, callback) {
        db.get(doc._id, function(err, res) {
          if (err) console.log(err);

          var x = _.extend({}, res, {
            posted: true,
            attendance_id: doc.attendance_id
          });
          db.insert(x, function(error, result) {
            if (error) console.log("error updated", error);

            callback();
          });
        });
      },
      function(err) {
        if (err) console.log("error with bulk update");

        console.log("all docs have been updated!");
        // pass control back to async jobs
        done();
      }
    );
  }
};
