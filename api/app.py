import couchdb
import json
from flask import Flask, g, jsonify
from flask_cors import CORS
import re
from collections import Counter

GEO_INFO_FILE = "config/suburbs.json"
JSON_MIME_TYPE = 'application/json'
LGA_PREFIX_FILE = "config/lga_prefix.json"
MELBOURNE_AREA_SUBURBS = "config/melbourne-suburbs.json"
LGA_COMPOSITION_FILE = "config/lga_composition.json"
PAGE_ROWS = 500

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
        g.couch_db = couchdb.Server("http://{}:{}@couchdb:5984".format("admin", "admin"))
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
    return get_couch_db().version()


@app.route('/tweets_sentiment/<state>')
def tweets_sentiment(state):
    state = state.upper()
    view = dict()
    start_index = "{}0000".format(get_lga_prefix()[state])
    end_index = "{}9999".format(get_lga_prefix()[state])
    melbourne_suburbs = get_melbourne_suburbs()
    for item in get_couch_db()['tweets_final'].view('tweets/suburb',
                                                     startkey=[start_index],
                                                     endkey=[end_index, "{}"],
                                                     group=True, group_level=2):
        suburb = item.key[1]
        # limiting of showing suburbs in Melbourne area
        if suburb.lower() in melbourne_suburbs:
            view[item.key[1]] = round(item.value["mean"], 3)
    return jsonify(view)


@app.route('/sickness_allowance/<state>')
def sickness_allowance(state):
    state = state.upper()
    view = dict()
    start_index = "{}0000".format(get_lga_prefix()[state])
    end_index = "{}9999".format(get_lga_prefix()[state])
    lga_composition = get_lga_composition()
    melbourne_suburbs = get_melbourne_suburbs()
    for item in get_statistic_view("medipayment", "lga_statistic", "sickness_allowance", start_index, end_index):
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
    for item in get_statistic_view("mentalhealthadmission", "lga_statistic", "mental_health", start_index, end_index):
        lga_name = re.sub(r'\(\S+\)', '', item.key[1]).strip()
        suburbs = lga_composition[lga_name]
        for suburb in suburbs:
            # limiting of showing suburbs in Melbourne area
            if suburb["suburb"].lower() in melbourne_suburbs:
                view[suburb["suburb"]] = item.value
    return jsonify(view)


@app.route('/monitoring')
def monitoring():
    view = list()
    users = dict()
    rankings = Counter()
    state = 'VIC'
    start_index = "{}0000".format(get_lga_prefix()[state])
    end_index = "{}9999".format(get_lga_prefix()[state])
    melbourne_suburbs = get_melbourne_suburbs()
    for item in get_couch_db()['tweets_final'].view('tweets/user',
                                                     startkey=[start_index],
                                                     endkey=[end_index, "{}"],
                                                     group=True, group_level=2):
        if item.value["suburb"].lower() in melbourne_suburbs:
            if item.value["count"] > 5:
                rankings[item.key[1]] = item.value["fluctuation"]
                case = dict()
                case["latitude"] = item.value["geo_coordinates"][1]
                case["longitude"] = item.value["geo_coordinates"][0]
                case["sentiment"] = round(item.value["sentiment"], 3)
                case["fluctuation"] = round(item.value["fluctuation"], 3)
                case["positive_text"] = item.value["positive_text"]
                case["negative_text"] = item.value["negative_text"]
                users[item.key[1]] = case


    ls = rankings.most_common(PAGE_ROWS)
    for l in ls:
        view.append(users[l[0]])
    return jsonify(view)


if __name__ == '__main__':
    #app.add_url_rule('/favicon.ico', redirect_to=url_for('static', filename='favicon.ico'))
    app.run(debug=True, host='0.0.0.0')
