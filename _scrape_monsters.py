import requests, re, json, sys
from bs4 import BeautifulSoup
import sqlite3 as lite
from time import sleep

# get kiranico urls (mapped via monster id; grab from json)
print 'grabbing kiranico urls'
kiranico_urls = {}
url = 'http://kiranico.com/en/mh4u/monster'
raw = requests.get(url)
parsed = BeautifulSoup(raw.content, from_encoding="utf-8")

for link in parsed.body.find_all('a'):
    if link.parent.name == 'p':
        monster_url = link['href']
        monster_raw = requests.get(monster_url)
        pattern = re.compile(ur"window.js_vars = (.*?);\<\/script\>")
        m = pattern.search(monster_raw.content)
        data = json.loads(m.group(1))
        kiranico_urls[int(data['monster']['id'])] = monster_url
        sleep(0.2)

# get damage data from mh4u.db
print 'grabbing damage tables'
con = lite.connect('mh4u.db')
cur = con.cursor()
cur.execute('select * from monsters order by _id;')
data = cur.fetchall()

monster_list = []
monster_data = {}

for row in data:
    damage_data = {}
    monster_damage_states = []

    cur.execute('select * from monster_damage where monster_id=? order by _id;', (row[0], ))
    ddata = cur.fetchall()

    pattern = re.compile(ur"(.+) \((.+)\)")

    # generate damage data tables
    for part in ddata:
        m = pattern.search(part[2])
        res = [part[3], part[4], part[5], part[6], part[7], part[8], part[9], part[10]]
        if res != [-1, -1, -1, -1, -1, -1, -1, -1]:
            damage_state_display_name = 'Default'
            if m:
                damage_state_display_name = m.group(2)

            damage_state = damage_state_display_name.replace(' ', '_').lower()
            if {'name': damage_state, 'display_name': damage_state_display_name} not in monster_damage_states:
                monster_damage_states.append({'name': damage_state, 'display_name': damage_state_display_name})

            if damage_state not in damage_data:
                damage_data[damage_state] = []
            damage_data[damage_state].append({
                'name': part[2],
                'damage': res
            })

    # only add monsters we have damage data for
    if len(damage_data) > 0:
        # check to see if we have kiranico url
        if row[0] in kiranico_urls:
            url_kiranico = kiranico_urls[row[0]]
        else:
            url_kiranico = ''

        # append to monster list
        monster_list.append({
            'id': row[0],
            'name': row[2],
            'sort_name': row[5]
        })

        # append to monster data
        monster_data[row[0]] = {
            'id': row[0],
            'name': row[2],
            'dmg_states': monster_damage_states,
            'url_kiranico': url_kiranico,
            'url_wikia': 'http://monsterhunter.wikia.com/wiki/' + row[2].replace(' ', '_')
        }

        for state in monster_damage_states:
            monster_data[row[0]]['damage_' + state['name']] = damage_data[state['name']]

#generate files
print 'generating files'
fmlist = open("monster_list.json", "w")
json.dump(monster_list, fmlist)

fmdata = open("monster_data.json", "w")
json.dump(monster_data, fmdata)
