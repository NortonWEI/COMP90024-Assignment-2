import couchdb
from flask import Flask, g, render_template

app = Flask(__name__)


def get_couch_db():
    if not hasattr(g, 'couch_db'):
        g.couch_db = couchdb.Server("http://couchdb:5984")
    return g.couch_db


@app.route('/')
def index():
    #return get_couch_db().version()
    return render_template('index.html')


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
    app.run(debug=True,host='0.0.0.0')
