from flask import Flask, render_template, jsonify
from backend import CalculatingPalico
from json import dumps
app = Flask(__name__, static_url_path='')

@app.route('/calculatingpalico/')
def main():
    return render_template('index.html')

@app.route('/calculatingpalico/weapon_types/', methods=['GET'])
def get_weapon_type_list():
    cp = CalculatingPalico()
    return dumps(cp.get_weapon_type_list())

@app.route('/calculatingpalico/weapon_types/<int:id>', methods=['GET'])
def get_weapon_type_details(id):
    cp = CalculatingPalico()
    return dumps(cp.get_weapon_type_details(id))

@app.route('/calculatingpalico/weapons/<int:id>', methods=['GET'])
def get_weapon_list(id):
    cp = CalculatingPalico()
    return dumps(cp.get_weapon_list(id))

@app.route('/calculatingpalico/monsters/', methods=['GET'])
def get_monster_list():
    cp = CalculatingPalico()
    return dumps(cp.get_monster_list())

@app.route('/calculatingpalico/weapon/<int:id>', methods=['GET'])
def get_weapon(id):
    cp = CalculatingPalico()
    return jsonify(cp.get_weapon_data(id))

@app.route('/calculatingpalico/monster/<int:id>', methods=['GET'])
def get_monster(id):
    cp = CalculatingPalico()
    return jsonify(cp.get_monster_data(id))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
