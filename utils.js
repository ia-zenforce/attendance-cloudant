var _ = require("lodash");

function buildAddress(address) {
  const { street, city, region, country } = address;
  return `${street ? `${street} St.,` : " "} ${city}, ${region}, ${country}`;
}

module.exports = {
  pluckDocuments: function(prev, next) {
    var id = {};
    id.attendance_id = next.attendance_id;
    if (next.couch_id_in) {
      id._id = next.couch_id_in;
      prev.push(id);
    }

    if (next.couch_id_out) {
      var out = {};
      out._id = next.couch_id_out;
      var newObj = _.extend({}, id, out);

      prev.push(newObj);
    }

    return prev;
  },
  prep: function(prev, curr) {
    console.log(curr);
    const currentAddress = curr.address;
    const address = Array.isArray(curr.address)
      ? buildAddress(curr.address[0])
      : curr.address;
    prev["user_id"] = curr.user_id;
    prev["task_id"] = curr.task_id;
    prev["attendancetype_id"] = curr.attendancetype_id;
    prev["user_id"] = curr.user_id;
    if (curr.type == "in") {
      prev["attendance_in"] = curr.time;
      prev["couch_id_in"] = curr._id;
      prev["address_in"] = address;
    } else {
      prev["attendance_out"] = curr.time;
      prev["couch_id_out"] = curr._id;
      prev["address_out"] = address;
      prev["attendance_id"] = curr.attendance_id;
    }

    return prev;
  }
};
