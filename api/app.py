import couchdb
import json
from flask import Flask, g, jsonify
import random
from flask_cors import CORS
import re

GEO_INFO_FILE = "config/suburbs.json"
JSON_MIME_TYPE = 'application/json'
LGA_PREFIX_FILE = "config/lga_prefix.json"
MELBOURNE_AREA_SUBURBS = "config/melbourne-suburbs.json"
LGA_COMPOSITION_FILE = "config/lga_composition.json"
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
        g.couch_db = couchdb.Server("http://{}:{}@couchdb:5984".format("user", "pass"))
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


def get_lga_prefix():
    if not hasattr(g, 'lga_prefix'):
        with open(LGA_PREFIX_FILE, 'r') as f:
            g.lga_prefix = json.load(f)
    return g.lga_prefix


def get_melbourne_suburbs():
    if not hasattr(g, 'melbourne_suburbs'):
        with open(MELBOURNE_AREA_SUBURBS, 'r') as f:
            suburbs = list()
            for suburb in json.load(f):
                suburbs.append(suburb["suburb"].lower())
            g.melbourne_suburbs = suburbs
    return g.melbourne_suburbs


def get_lga_composition():
    if not hasattr(g, 'lga_composition'):
        with open(LGA_COMPOSITION_FILE, 'r') as f:
            g.lga_composition = json.load(f)
    return g.lga_composition


def get_statistic_view(collection_name, design_doc_name, view_name, start_key, end_key):
    return get_couch_db()[collection_name].view('{}/{}'.format(design_doc_name, view_name),
                                                startkey=[start_key],
                                                endkey=[end_key, "{}"])


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
    state = state.upper()
    view = dict()
    start_index = "{}0000".format(get_lga_prefix()[state])
    end_index = "{}9999".format(get_lga_prefix()[state])
    lga_composition = get_lga_composition()
    melbourne_suburbs = get_melbourne_suburbs()
    for item in get_statistic_view("medipayment", "sickness_allowance", "sickness_allowance", start_index, end_index):
        lga_name = re.sub(r'\(\S+\)', '', item.key[1]).strip()
        suburbs = lga_composition[lga_name]
        for suburb in suburbs:
            # limiting of showing suburbs in Melbourne area
            if suburb["suburb"].lower() in melbourne_suburbs:
                view[suburb["suburb"]] = item.value
    return jsonify(view)


@app.route('/mental_health/<state>')
def mental_health(state):
    state = state.upper()
    view = dict()
    start_index = "{}0000".format(get_lga_prefix()[state])
    end_index = "{}9999".format(get_lga_prefix()[state])
    lga_composition = get_lga_composition()
    melbourne_suburbs = get_melbourne_suburbs()
    for item in get_statistic_view("mentalhealthadmission", "distribution", "mental_health_view", start_index, end_index):
        lga_name = re.sub(r'\(\S+\)', '', item.key[1]).strip()
        suburbs = lga_composition[lga_name]
        for suburb in suburbs:
            # limiting of showing suburbs in Melbourne area
            if suburb["suburb"].lower() in melbourne_suburbs:
                view[suburb["suburb"]] = item.value
    return jsonify(view)

# TODO only for generating data
@app.route('/my_test_view/<state>')
def my_test_view(state):
    lga_prefixs = get_lga_prefix()
    start_index = lga_prefixs[state]
    end_index = str(int(start_index) + 1)
    couchdb = get_couch_db()
    dbname = "medipayment"
    intersections = dict()

    for item in couchdb[dbname].view('sickness_allowance/sickness_allowance', startkey=["{}0000".format(start_index)], endkey=["{}0000".format(end_index), "{}"]):
        intersections[(re.sub(r'\(\S+\)', '', item.key[1]).strip(), item.key[0])] = 0

    dbname = "mentalhealthadmission"
    for item in couchdb[dbname].view('distribution/mental_health_view', startkey=["{}0000".format(start_index)], endkey=["{}0000".format(end_index), "{}"]):
        area = (re.sub(r'\(\S+\)', '', item.key[1]).strip(), item.key[0])
        if area in intersections.keys():
            intersections[area] = 1

    intersections = {k[0]: k[1] for k, v in intersections.items() if v > 0}
    suburbs = [sub for sub in get_geo_info() if sub.state_code == state]
    out_dict = dict()

    for name, code in intersections.items():
        if name not in out_dict.keys():
            out_dict[name] = list()

        for sub in suburbs:
            if code == sub.lga_code:
                s = dict()
                s["postcode"] = sub.postcode
                s["suburb"] = sub.suburb
                out_dict[name].append(s)

    print(out_dict)
    return "{} of suburbs and {} of local government areas".format(len(suburbs),len(out_dict))


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
