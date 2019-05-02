import tweepy, json, requests
from requests.auth import HTTPDigestAuth

# App credentials for Twitter API
with open('app-credentials.json') as twCredentialFile:
    twCredentials = json.load(twCredentialFile)
    ACCESS_TOKEN = twCredentials["ACCESS_TOKEN"]
    ACCESS_SECRET = twCredentials["ACCESS_SECRET"]
    CONSUMER_KEY = twCredentials["CONSUMER_KEY"]
    CONSUMER_SECRET = twCredentials["CONSUMER_SECRET"]

# CouchDB config
with open('couchdb-credentials.json') as couchCredentialFile:
    couchCredentials = json.load(couchCredentialFile)
    username = couchCredentials["username"]
    password = couchCredentials["password"]
    couchAuth = HTTPDigestAuth(username, password)

couchUrl = 'http://127.0.0.1:5984/'
dbName = 'tweets'

# Authenticate with App credentials
twAuth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
twAuth.set_access_token(ACCESS_TOKEN, ACCESS_SECRET)

# Create the API with authentication methods
twApi = tweepy.API(twAuth)


# Get real-time tweets form Twitter Streaming API
class StreamListener(tweepy.StreamListener):

    def on_status(self, status):
        tweet = status._json    # dict type
        twId = str(tweet['id'])
        docUrl = couchUrl + dbName + '/' + twId # use tweet id as document id
        jsonStr = json.dumps(status._json)
        r = requests.put(docUrl, data=jsonStr, auth=couchAuth)
        print(r.text)

    def on_error(self, status_code):
        if status_code == 420:
            # returning False in on_data disconnects the stream
            return False


streamListener = StreamListener()
stream = tweepy.Stream(auth=twApi.auth, listener=streamListener)
AU_BOX = [112.5, -43.7, 154.3, -12.0]  # A bounding box covering major Australia
stream.filter(locations=AU_BOX)

