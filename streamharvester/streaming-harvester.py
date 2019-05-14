import tweepy, json, requests, multiprocessing
from requests.auth import HTTPBasicAuth
from textblob import TextBlob
from shapely.geometry import Point, Polygon


# check if point [longitude, latitude] is within the suburb area
def in_suburb(longitude, latitude, suburb):
    # return suburb['bound_w'] < longitude <= suburb['bound_e'] \
    #        and suburb['bound_s'] <= latitude < suburb['bound_n']
    point = Point(longitude, latitude)
    polygon = Polygon(suburb['polygon'])
    return point.within(polygon)


# convert from coordinates to a suburb and write in to the tweet object
def coor_to_suburb(longitude, latitude, tweet):
    for suburb in suburb_list:
        if in_suburb(longitude, latitude, suburb):
            tweet['suburb'] = suburb['suburb']
            tweet['postcode'] = suburb['postcode']
            tweet['state'] = suburb['state']
            tweet['lga_name'] = suburb['lga_name']
            tweet['lga_code'] = suburb['lga_code']
            tweet['geo_precision'] = 'suburb'
            break


def suburb_to_coor(suburb_name):
    for s in suburb_list:
        if s['suburb'] == suburb_name:
            return [s['longitude'], s['latitude']]


# extract geo information and discard unwanted tweets
def process(tweet):
    tw_id = tweet["id_str"]
    if tweet['truncated'] is True:
        text = tweet['extended_tweet']['full_text']
    else:
        text = tweet['text']
    blob = TextBlob(text)
    tweet['polarity'] = blob.sentiment.polarity
    tweet['subjectivity'] = blob.sentiment.subjectivity
    tweet['suburb'] = None
    tweet['postcode'] = None
    tweet['state'] = None
    tweet['lga_name'] = None
    tweet['lga_code'] = None
    tweet['geo_precision'] = None
    tweet['geo_coordinates'] = None
    if tweet['place'] and tweet['place']['place_type'] == 'neighborhood':
        tweet['suburb'] = tweet['place']['name']
        tweet['geo_precision'] = 'suburb'
        for suburb in suburb_list:
            if tweet['place']['name'] == suburb['suburb']:
                tweet['postcode'] = suburb['postcode']
                tweet['state'] = suburb['state']
                tweet['lga_name'] = suburb['lga_name']
                tweet['lga_code'] = suburb['lga_code']
                break
    elif tweet['place'] and tweet['place']['place_type'] == 'poi':
        # if the place type is point, 4 coordinates in the bounding box
        # are the same so we choose whichever one as our coordinates
        longitude = tweet['place']['bounding_box']['coordinates'][0][0][0]
        latitude = tweet['place']['bounding_box']['coordinates'][0][0][1]
        coor_to_suburb(longitude, latitude, tweet)
    elif tweet['coordinates']:
        longitude = tweet['coordinates']['coordinates'][0]
        latitude = tweet['coordinates']['coordinates'][1]
        coor_to_suburb(longitude, latitude, tweet)
    elif tweet['place'] and tweet['place']['place_type'] == 'city':
        for suburb in suburb_list:
            if tweet['place']['name'] == suburb['lga_name']:
                tweet['state'] = suburb['state']
                tweet['lga_name'] = suburb['lga_name']
                tweet['lga_code'] = suburb['lga_code']
                tweet['geo_precision'] = 'city'
                break
            if tweet['place']['name'] == suburb['suburb']:
                tweet['suburb'] = suburb['suburb']
                tweet['postcode'] = suburb['postcode']
                tweet['state'] = suburb['state']
                tweet['lga_name'] = suburb['lga_name']
                tweet['lga_code'] = suburb['lga_code']
                tweet['geo_precision'] = 'suburb'
                break
    elif tweet['place'] and tweet['place']['place_type'] == 'admin':
        tweet['geo_precision'] = 'state'
    if tweet['geo_precision'] == 'suburb' and tweet['state'] == 'VIC':
        if tweet['coordinates']:
            tweet['geo_coordinates'] = tweet['coordinates']['coordinates']
        else:
            tweet['geo_coordinates'] = suburb_to_coor(tweet['suburb'])
        if blob.sentiment.polarity != 0:
            doc_url = couch_url + tweets_db_name + '/' + tw_id
            json_str = json.dumps(tweet)
            r = requests.put(doc_url, data=json_str, auth=couch_auth)
            print(r.text)
        tweet_user = tweet['user']
        tweet_user['suburb'] = tweet['suburb']
        tweet_user['postcode'] = tweet['postcode']
        tweet_user['state'] = tweet['state']
        tweet_user['lga_name'] = tweet['lga_name']
        tweet_user['lga_code'] = tweet['lga_code']
        tweet_user['geo_precision'] = tweet['geo_precision']
        tweet_user['geo_coordinates'] = tweet['geo_coordinates']
        return tweet_user
    return None


# Create class MyStreamListener inheriting from StreamListener and overriding
# on_status and on_error
class MyStreamListener(tweepy.StreamListener):

    def on_status(self, status):
        tweet = status._json
        tweet_user = process(tweet)
        if tweet_user:
            user_screen_name = tweet_user['screen_name']
            user_doc_url = couch_url + user_db_name + '/' + user_screen_name
            user_json = json.dumps(tweet_user)
            r = requests.put(user_doc_url, data=user_json, auth=couch_auth)
            if r.status_code == 201:
                print('[user]', user_screen_name)
                # multiprocessing.Process(target=process_user_timeline, args=(tweet_user,)).start()


    def on_error(self, status_code):
        if status_code in [420, 429]:
            # Disconnects the stream when the app's rate limit having been
            # exhausted for the resource.
            return False


if __name__ == '__main__':

    with open('suburb-geo-lga-new.json') as suburb_file:
        suburb_list = json.load(suburb_file)
        for suburb in suburb_list:
            if suburb['polygon']:
                polygon = []
                for coor in suburb['polygon']:
                    polygon.append(tuple(coor))
                suburb['polygon'] = polygon
    print('Finished pre-processing.')

    # App credentials for Twitter API
    with open('app-credentials.json') as twCredentialFile:
        twCredentials = json.load(twCredentialFile)
        ACCESS_TOKEN = twCredentials["ACCESS_TOKEN"]
        ACCESS_SECRET = twCredentials["ACCESS_SECRET"]
        CONSUMER_KEY = twCredentials["CONSUMER_KEY"]
        CONSUMER_SECRET = twCredentials["CONSUMER_SECRET"]

    # CouchDB config
    with open('couchdb-config.json') as couch_config_file:
        couch_config = json.load(couch_config_file)
        couch_username = couch_config["username"]
        couch_password = couch_config["password"]
        couch_auth = HTTPBasicAuth(couch_username, couch_password)
        couch_url = couch_config["couch_url"]
        tweets_db_name = couch_config["tweets_db_name"]
        user_db_name = couch_config["user_db_name"]
    requests.put(couch_url + tweets_db_name, auth=couch_auth)
    requests.put(couch_url + user_db_name, auth=couch_auth)

    # Authenticate with App credentials
    tw_auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    tw_auth.set_access_token(ACCESS_TOKEN, ACCESS_SECRET)

    # Create the API with authentication methods
    tw_api = tweepy.API(auth_handler=tw_auth, wait_on_rate_limit=True,
                        wait_on_rate_limit_notify=True)

    # Get real-time tweets form Twitter Streaming API
    streamListener = MyStreamListener()
    stream = tweepy.Stream(auth=tw_api.auth, listener=streamListener)
    VIC_BOX = [140.961682, -39.15919, 149.976679, -33.980426]  # A bounding box covering VIC
    stream.filter(locations=VIC_BOX, languages=['en'])

