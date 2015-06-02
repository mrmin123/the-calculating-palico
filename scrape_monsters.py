'''
Quick and dirty script for parsing monster data from kiranico and
the mh4udb file
'''
import requests, re, json, sys
from bs4 import BeautifulSoup
import sqlite3 as lite
from time import sleep

kiranico_urls = {}
monster_list = []
monster_data = {}

def kiranico_url_collector():
    # get kiranico urls (mapped via monster id; grab from json)
    print 'grabbing kiranico urls'
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

def mh4udb_parse():
    # get damage data from mh4u.db
    print 'grabbing damage tables'
    con = lite.connect('mh4u.db')
    cur = con.cursor()
    cur.execute('select * from monsters order by _id;')
    data = cur.fetchall()
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
                    # correct spelling mistake in mh4udb
                    if damage_state_display_name == 'Fatiqued':
                        damage_state_display_name = 'Fatigued'

                damage_state = damage_state_display_name.replace(' ', '_').lower()
                if damage_state != 'break_part' and damage_state != 'without_hide':
                    if {'name': damage_state, 'display_name': damage_state_display_name} not in monster_damage_states:
                        monster_damage_states.append({'name': damage_state, 'display_name': damage_state_display_name})

                    if damage_state not in damage_data:
                        damage_data[damage_state] = []
                    damage_data[damage_state].append({
                        'name': part[2],
                        'damage': res
                    })
                else:
                    for part in damage_data['default']:
                        if part['name'] == m.group(1):
                            if part['damage'] != res:
                                part['damage_broken'] = res

        # check to see if we have kiranico url
        if row[0] in kiranico_urls:
            url_kiranico = kiranico_urls[row[0]]
        else:
            url_kiranico = ''

        add_entry = False

        if len(damage_data) > 0:
            # if we have damage data from mh4udb, add data
            add_entry = True
        else:
            # if we have no damage data from mh4udb but a kiranico url, try that
            # i.e. Gogmazios, Fatalis, etc
            if url_kiranico != '':
                add_entry, damage_data, monster_damage_states = kiranico_parse(url_kiranico)

        if add_entry:
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
                'damage_states': monster_damage_states,
                'url_kiranico': url_kiranico,
                'url_wikia': 'http://monsterhunter.wikia.com/wiki/' + row[2].replace(' ', '_')
            }
            for state in monster_damage_states:
                monster_data[row[0]]['damage_' + state['name']] = damage_data[state['name']]

def generate_files():
    #generate files
    print 'generating files'
    fmlist = open("monster_list.json", "w")
    json.dump(monster_list, fmlist)

    fmdata = open("monster_data.json", "w")
    json.dump(monster_data, fmdata)

def kiranico_parse(url):
    damage_data = {}
    monster_damage_states = []
    raw = requests.get(url)
    pattern = re.compile(ur"window.js_vars = (.*?);\<\/script\>")
    m = pattern.search(raw.content)
    data = json.loads(m.group(1))
    valid_data = False
    for i in data['monster']['monsterbodyparts']:
        res = [int(i['pivot']['res_cut']), int(i['pivot']['res_impact']), int(i['pivot']['res_shot']), int(i['pivot']['res_fire']), int(i['pivot']['res_water']), int(i['pivot']['res_ice']), int(i['pivot']['res_thunder']), int(i['pivot']['res_dragon'])]
        if res != [0, 0, 0, 0, 0, 0, 0, 0]:
            valid_data = True

        state = 'Default'
        if i['pivot']['type'] == 'A':
            state = 'Default'
        elif i['pivot']['type'] == 'B':
            state = 'Break Part'
        elif i['pivot']['type'] == 'C':
            state = 'Enraged'

        damage_state = state.replace(' ', '_').lower()
        if damage_state != 'break_part':
            if {'name': damage_state, 'display_name': state} not in monster_damage_states:
                monster_damage_states.append({'name': damage_state, 'display_name': state})

            if damage_state not in damage_data:
                damage_data[damage_state] = []
            damage_data[damage_state].append({
                'name': i['local_name'],
                'damage': res
            })
        else:
            for part in damage_data['default']:
                if part['name'] == i['local_name']:
                    if part['damage'] != res:
                        part['damage_broken'] = res
    return (valid_data, damage_data, monster_damage_states)

kiranico_url_collector()
mh4udb_parse()
generate_files()
