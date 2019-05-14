module.exports = function (grunt) {
  grunt
    .initConfig({
      "couch-compile": {
        dbs: {
          files: {
            // "/tmp/tweets.json": "couchdb/twitter/tweets",
            "/tmp/medipayment.json":"couchdb/twitter/medipayment",
            "/tmp/mentalhealthadmission.json":"couchdb/twitter/mentalhealthadmission"
          }
        }
      },
      "couch-push": {
        options: {
          user: 'admin',
          pass: 'admin'
        },
        medipayment: {
          files: {
            // "http://172.26.37.176:5984/tweets_final": "/tmp/tweets.json",
            "http://172.26.37.176:5984/medipayment": "/tmp/medipayment.json",
            "http://172.26.37.176:5984/mentalhealthadmission": "/tmp/mentalhealthadmission.json"
          }
        }
      }
    });

  grunt.loadNpmTasks("grunt-couch");
};
