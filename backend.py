import json

class CalculatingPalico:
    def __init__(self):
        self.weapon_type_list = []
        self.weapon_list = []
        self.sharpness = []
        self.monster_list = []
        self.weapon_data = []
        self.monster_data = []

        self.load_weapon_types()
        self.load_weapons()
        self.load_sharpness()
        self.load_monsters()

    def load_weapon_types(self):
        with open('weapon_type.json') as open_file:
            self.weapon_type_list = json.load(open_file)

    def load_weapons(self):
        with open('weapon_list.json') as open_file:
            self.weapon_list = json.load(open_file)
        with open('weapon_data.json') as open_file:
            self.weapon_data = json.load(open_file)

    def load_sharpness(self):
        with open('sharpness.json') as open_file:
            self.sharpness = json.load(open_file)

    def load_monsters(self):
        with open('monster_list.json') as open_file:
            self.monster_list = json.load(open_file)
        with open('monster_data.json') as open_file:
            self.monster_data = json.load(open_file)

    def get_weapon_type_list(self):
        return self.weapon_type_list

    def get_weapon_type_details(self, id):
        return next((d for d in self.weapon_type_list if d['id'] == id), None)

    def get_monster_list(self):
        return self.monster_list

    def get_weapon_list(self, id):
        temp = []
        for d in self.weapon_list:
            if d['class'] == id:
                temp.append(d)
        return temp

    def get_weapon_data(self, id):
        return next((d for d in self.weapon_data if d['id'] == id), None)

    def get_monster_data(self, id):
        return next((d for d in self.monster_data if d['id'] == id), None)
