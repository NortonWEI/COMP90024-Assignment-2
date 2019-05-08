import couchdb
import json
from flask import Flask, g, jsonify, url_for
import random
from flask_cors import CORS

GEO_INFO_FILE = "config/suburbs.json"
JSON_MIME_TYPE = 'application/json'
TEST_QUOTA = 50

app = Flask(__name__)
CORS(app)


class Suburb:
    def __init__(self, postcode, suburb, lga_code, lga_name, state_code, state):
        self.postcode = postcode
        self.suburb = suburb
        self.lga_code = lga_code
        self.lga_name = lga_name
        self.state_code = state_code
        self.state = state


def get_couch_db():
    if not hasattr(g, 'couch_db'):
        g.couch_db = couchdb.Server("http://couchdb:5984")
    return g.couch_db


def get_geo_info():
    if not hasattr(g, 'geo_info'):
        g.geo_info = list()
        with open(GEO_INFO_FILE, 'r') as f:
            suburb_jsons = json.load(f)
            for suburb_json in suburb_jsons:
                s = Suburb(suburb_json['postcode'], suburb_json['suburb'], suburb_json['lga_code'],
                           suburb_json['lga_name'], suburb_json['state_code'], suburb_json['state'])
                g.geo_info.append(s)
    return g.geo_info


@app.route('/')
def index():
    suburbs = get_geo_info()
    for s in suburbs:
        print("{},{},{},{}".format(s.postcode, s.suburb, s.lga_name, s.state))
    return "Total number of suburbs:{}".format(str(len(suburbs)))
    # return get_couch_db().version()
    #return render_template('index.html')


@app.route('/tweets_sentiment/<state>')
def tweets_sentiment(state):
    suburbs = [sub for sub in get_geo_info() if sub.state_code == state]
    view = dict()
    access_index = 0
    while len(view) < TEST_QUOTA:
        #access_index = random.randint(0, len(suburbs) - 1)
        access_index += 1
        view[suburbs[access_index].suburb] = round(random.uniform(-1, 1), 3)
    return jsonify(view)


@app.route('/sickness_allowance/<state>')
def sickness_allowance(state):
    suburbs = [sub for sub in get_geo_info() if sub.state_code == state]
    view = dict()
    access_index = 0
    while len(view) < TEST_QUOTA:
        #access_index = random.randint(0, len(suburbs) - 1)
        access_index += 1
        view[suburbs[access_index].suburb] = round(random.uniform(0, 200), 3)
    return jsonify(view)


@app.route('/mental_health/<state>')
def mental_health(state):
    suburbs = [sub for sub in get_geo_info() if sub.state_code == state]
    view = dict()
    access_index = 0
    while len(view) < TEST_QUOTA:
        #access_index = random.randint(0, len(suburbs) - 1)
        access_index += 1
        view[suburbs[access_index].suburb] = random.randint(1, 200)
    return jsonify(view)


@app.route('/monitoring')
def monitoring():
    view = list()
    coordinates = [(-37.7984, 144.9449), (-37.7833, 144.95), (-37.7603, 144.9502), (-37.8, 144.9667),
                   (-37.8004, 144.9681), (-37.7818, 144.9666), (-37.7833, 144.9667), (-37.7603, 144.9502),
                   (-37.7646, 144.9438), (-37.7603, 144.9502), (-37.7603, 144.9502), (-37.7667, 144.9667),
                   (-37.7667, 144.9667), (-37.7667, 144.9667), (-37.7603, 144.9502), (-37.7725, 144.9724)]
    while len(view) < TEST_QUOTA:
        case = dict()
        coordinate = coordinates[random.randint(0, len(coordinates) - 1)]
        case["latitude"] = coordinate[0]
        case["longitude"] = coordinate[1]
        case["low_score"] = round(random.uniform(-1, 0), 3)
        case["high_score"] = round(random.uniform(0, 1), 3)
        view.append(case)
    return jsonify(view)

@app.route('/', methods=['POST'])
def add():
    dbname = "wta2019"
    couchdb = get_couch_db()
    db = couchdb[dbname] if dbname in couchdb else couchdb.create(dbname)
    saved_ids = list()
    doc = {'name': 'Garbiñe Muguruza'}
    db.save(doc)
    saved_ids.append(doc)
    doc = {'name': ' Hsieh Su-wei'}
    db.save(doc)
    saved_ids.append(doc)

    return str(saved_ids)


@app.route('/wta/2019/<uuid>')
def query(uuid):
    dbname = "wta2019"
    db = get_couch_db()[dbname]
    return db[uuid]['name']


if __name__ == '__main__':
    #app.add_url_rule('/favicon.ico', redirect_to=url_for('static', filename='favicon.ico'))
    app.run(debug=True, host='0.0.0.0')
