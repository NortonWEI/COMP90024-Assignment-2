import json, requests, tweepy, time
from requests.auth import HTTPBasicAuth
from textblob import TextBlob


def process_user_tweet(tweet, user):
    tw_id = tweet["id_str"]
    if tweet['truncated'] is True and 'extended_tweet' in tweet:
        text = tweet['extended_tweet']['full_text']
    else:
        text = tweet['text']
    blob = TextBlob(text)
    tweet['polarity'] = blob.sentiment.polarity
    tweet['subjectivity'] = blob.sentiment.subjectivity
    tweet['suburb'] = user['suburb']
    tweet['postcode'] = user['postcode']
    tweet['state'] = user['state']
    tweet['lga_name'] = user['lga_name']
    tweet['lga_code'] = user['lga_code']
    tweet['geo_precision'] = user['geo_precision']
    tweet['geo_coordinates'] = user['geo_coordinates']
    if blob.sentiment.polarity != 0:
        doc_url = couch_url + tweets_db_name + '/' + tw_id
        json_str = json.dumps(tweet)
        r = requests.put(doc_url, data=json_str, auth=couch_auth)
        print('[user]', user['screen_name'], r.text)


def process_user_timeline(tweet_user):
    user_screen_name = tweet_user['screen_name']
    for status in tweepy.Cursor(
            tw_api.user_timeline, screen_name=user_screen_name).items(500):
        tweet = status._json
        process_user_tweet(tweet, tweet_user)


if __name__ == '__main__':

    # CouchDB config
    with open('couchdb-config.json') as couch_config_file:
        couch_config = json.load(couch_config_file)
        couch_username = couch_config["username"]
        couch_password = couch_config["password"]
        couch_auth = HTTPBasicAuth(couch_username, couch_password)
        couch_url = couch_config["couch_url"]
        tweets_db_name = couch_config["tweets_db_name"]
        user_db_name = couch_config["user_db_name"]

    # App credentials for Twitter API
    with open('app-credentials-hugh.json') as tw_credential_file:
        tw_credentials = json.load(tw_credential_file)
        ACCESS_TOKEN = tw_credentials["ACCESS_TOKEN"]
        ACCESS_SECRET = tw_credentials["ACCESS_SECRET"]
        CONSUMER_KEY = tw_credentials["CONSUMER_KEY"]
        CONSUMER_SECRET = tw_credentials["CONSUMER_SECRET"]

    # Authenticate with App credentials
    tw_auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    tw_auth.set_access_token(ACCESS_TOKEN, ACCESS_SECRET)

    # Create the API with authentication methods
    tw_api = tweepy.API(auth_handler=tw_auth, wait_on_rate_limit=True,
                        wait_on_rate_limit_notify=True)

    requests.put(couch_url + tweets_db_name, auth=couch_auth)
    requests.put(couch_url + user_db_name, auth=couch_auth)
    payload = {'since': "now"}
    r = requests.get(couch_url + user_db_name + '/' + '_changes', params=payload)
    last_seq = r.json()['last_seq']

    while True:
        payload = {'since': last_seq}
        r = requests.get(couch_url + user_db_name + '/' + '_changes', params=payload)
        reply = r.json()
        last_seq = reply['last_seq']
        results = reply['results']
        for re in results:
            screen_name = re['id']
            tweet_user = requests.get(couch_url + user_db_name + '/' + screen_name).json()
            try:
                process_user_timeline(tweet_user)
            except tweepy.error.TweepError:
                continue    # in case username does not exist (error 404)
        print('Sleep for 5 s...')
        time.sleep(5)

