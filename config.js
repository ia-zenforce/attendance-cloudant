module.exports = {
  couch_url:
    process.env.COUCH_URI ||
    "https://79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix:2b80d31c5af1b5b06644b5cdcaf999c1d9684e43750836636b29698449513956@79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix.cloudant.com" ||
    "http://localhost:5984",
  mongo_url: process.env.MONGO_URI || "mongodb://localhost/agenda",
  service_url: "https://zf.zennerslab.com",
  // service_url: 'http://192.168.5.18:2345',
  cloudant: {
    username: "79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix",
    password:
      "2b80d31c5af1b5b06644b5cdcaf999c1d9684e43750836636b29698449513956",
    host: "79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix.cloudant.com",
    port: 443,
    url:
      "https://79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix:2b80d31c5af1b5b06644b5cdcaf999c1d9684e43750836636b29698449513956@79b25280-149e-4d30-b796-d144bf8bb0b7-bluemix.cloudant.com"
  }
};
