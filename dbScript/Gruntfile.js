module.exports = function (grunt) {
  grunt
    .initConfig({
      "couch-compile": {
        dbs: {
          files: {
            "/tmp/tweets.json": "couchdb/tweets_sample/tweets"
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
            "http://172.26.37.208:5984/tweets_sample": "/tmp/tweets.json"
          }
        }
      }
    });

  grunt.loadNpmTasks("grunt-couch");
};
