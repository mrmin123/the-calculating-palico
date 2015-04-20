// function for summing up numeric arrays
arraySum = function (array) {
	return array.reduce(function(a, b) { return a + b; });
}

// UI skill group highlighting
var skillGroups = [
	'.groupSharpness', '.groupAwaken', '.groupWeakEx', '.groupC', '.groupD',
	'.groupF', '.groupG', '.groupH', '.groupHE', '.groupI',
	'.groupJ', '.groupExpert', '.groupElem', '.groupEFire', '.groupEWater',
	'.groupEIce', '.groupEThunder', '.groupEDragon'
];

$(skillGroups.join(', ')).hover(
	function() {
		var temp = $(this).attr('class').split(' ');
		temp.shift();
		$('.' + temp.join(', .')).css({'background': '#eee'});
	},
	function() {
		var temp = $(this).attr('class').split(' ');
		temp.shift();
		$('.' + temp.join(', .')).css({'background': 'none'});
	}
);

// toggle -/+ icons for modifier panel
$('.toggle_modifiers').click(function() {
	$(this).toggleClass('fa-minus-square-o fa-plus-square-o');
});

/* angular */
// service for calculating individual damage numbers
var calculatingPalico = angular.module('calculatingPalico', ['ui.bootstrap'])
	.service('calculatorService', function() {
		this.calcDamage = function(mode, range, elemental, motion, weapon, weaponType, monster, damage, elements, sharpness, modifiers, eindex) {
			// return blank if any of the parameters are undefined (user hasn't input all necessary values)
			if (typeof motion === 'undefined' || typeof weapon === 'undefined' || typeof weaponType === 'undefined' || typeof monster === 'undefined' || typeof damage === 'undefined') {
				return '';
			}

			// raw power calculation function
			pPwr = function(attack, affinity, modifier, sharpness, modmul, modadd) {
				if (affinity > 100) { affinity = 100; }
				return (((attack / modifier) + modadd) * (1 + 0.25 * (affinity/100)))  * sharpness * (1 + modmul);
			};
			// raw elemental power calculation function
			ePwr = function(attack, sharpness) {
				return (attack / 10) * sharpness;
			};
			// true power calculation function
			pDmg = function(pwr, motionPower, res) {
				if (modifiers.weakex == true && res > 44) { res += 5; }
				return Math.round(pwr * (motionPower / 100) * (res / 100));
			};
			// true elemental power calculation function
			eDmg = function(pwr, res, modmul, modadd) {
				if (modmul > 0.2) { modmul = 0.2; }
				return Math.round(((pwr + (modadd / 10)) * (1 + modmul) ) * (res / 100));
			};

			// function for keeping track of min/max damage values
			calculateRanges = function() {
				var sum = arraySum(raw);;
				var sumE = arraySum(rawE);;
				var sumE2 = arraySum(rawE2);
				if (sum + sumE + sumE2 < rangeMin || rangeMin == 0) {
					rangeMin = sum + sumE + sumE2;
					tempShowValMin = sum + 0;
					tempShowValMinE = sumE + 0;
					tempShowValMinE2 = sumE2 + 0;
				}
				if (sum + sumE + sumE2 > rangeMax) {
					rangeMax = sum + sumE + sumE2;
					tempShowValMax = sum + 0;
					tempShowValMaxE = sumE + 0;
					tempShowValMaxE2 = sumE2 + 0;
				}
			};

			// function for returning min/max damage values
			returnRangeVal = function() {
				if (range == 'lo') {
					if (elemental == 0) return tempShowValMin;
					else if (elemental == 1) {
						if (eindex == 0) return '+' + tempShowValMinE;
						else if (eindex == 1) return '+' + tempShowValMinE2;
					}
				}
				else if (range == 'hi') {
					if (elemental == 0) return tempShowValMax;
					else if (elemental == 1) {
						if (eindex == 0) return '+' + tempShowValMaxE;
						else if (eindex == 1) return '+' + tempShowValMaxE2;
					}
				}
			};

			var affinityBase = 0
			// modify affinity based on frenzy virus modifiers (and frenzy virus weapons)
			if (weapon.affinity_virus != null) {
				if (modifiers.virusovercome == true) affinityBase = Math.abs(weapon.affinity) + weapon.affinity_virus;
				else affinityBase = weapon.affinity + weapon.affinity_virus;
			}
			else {
				if (modifiers.virusovercome == true) affinityBase = weapon.affinity + 15;
				else affinityBase = weapon.affinity;
			}

			// define temp variables
			var tempShowValMin = 0;
			var tempShowValMax = 0;
			var tempShowValMinE = 0;
			var tempShowValMaxE = 0;
			var tempShowValMinE2 = 0;
			var tempShowValMaxE2 = 0;
			// define sharpness modifier values
			var sharpnessMod = [0.5, 0.75, 1.0, 1.125, 1.25, 1.32, 1.44];
			var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

			// calculate raw power
			var pwr = pPwr(weapon.attack, affinityBase + modifiers.aff, weapon.modifier, sharpnessMod[sharpness], modifiers.pMul, modifiers.pAdd);
			var epwr = 0;
			var etype = 0
			var epwr2 = 0;;
			var etype2 = 0;

			// calculate raw elemental power
			if (elements.length == 1) {
				if (elements[0].id < 6) {
					epwr = ePwr(elements[0].attack, sharpnessModE[sharpness]);
					etype = elements[0].id;
				}
			}
			else if (elements.length == 2) {
				if (elements[0].id < 6) {
					epwr = ePwr(elements[0].attack, sharpnessModE[sharpness]);
					etype = elements[0].id;
				}
				if (elements[1].id < 6) {
					epwr2 = ePwr(elements[1].attack, sharpnessModE[sharpness]);
					etype2 = elements[1].id;
				}
			}

			var raw = [0];
			var rawE = [0];
			var rawE2 = [0];
			var rangeMin = 0;
			var rangeMax = 0;
			if (mode == 'specific') {
				// calculate damage for specific move and body part
				for (i = 0; i < motion.power.length; i++) {
					raw.push(pDmg(pwr, motion.power[i], damage[motion.type[i]]));
					if (elements.length > 1) {
						if (i % 2 == 0) { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
						else { rawE2.push(eDmg(epwr2, damage[2 + etype2], modifiers.elem[etype2].eMul, modifiers.elem[etype2].eAdd)); }
					}
					else { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
				}
				var sum = arraySum(raw);
				var sumE = arraySum(rawE);
				var sumE2 = arraySum(rawE2);
				if (elemental == 0) {return sum; }
				else if (elemental == 1) {
					if (eindex == 0) return '+' + sumE;
					else if (eindex == 1) return '+' + sumE2;
				}
			}
			else if (mode == 'perPart') {
				// calculate damages for all moves for one part
				for (i = 0; i < weaponType.motions.length; i++) {
					raw = [0];
					rawE = [0];
					rawE2 = [0];
					for (j = 0; j < weaponType.motions[i].power.length; j++) {
						raw.push(pDmg(pwr, weaponType.motions[i].power[j], damage[weaponType.motions[i].type[j]]));
						if (elements.length > 1) {
							if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
							else { rawE2.push(eDmg(epwr2, damage[2 + etype2], modifiers.elem[etype2].eMul, modifiers.elem[etype2].eAdd)); }
						}
						else { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
					}
					calculateRanges();
				}
				return returnRangeVal();
			}
			else if (mode == 'perMove') {
				// calculate damages for all parts by one move
				for (i = 0; i < damage.length; i++) {
					raw = [0];
					rawE = [0];
					rawE2 = [0];
					for (j = 0; j < motion.power.length; j++) {
						raw.push(pDmg(pwr, motion.power[j], damage[i].damage[motion.type[j]]));
						if (elements.length > 1) {
							if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[i].damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
							else { rawE2.push(eDmg(epwr, damage[i].damage[2 + etype2], modifiers.elem[etype2].eMul, modifiers.elem[etype2].eAdd)); }
						}
						else { rawE.push(eDmg(epwr, damage[i].damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
					}
					calculateRanges();
				}
				return returnRangeVal();
			}
			else if (mode == 'all') {
				// calculate total damage range
				for (k = 0; k < damage.length; k ++) {
					for (i = 0; i < weaponType.motions.length; i++) {
						raw = [0];
						rawE = [0];
						rawE2 = [0];
						for (j = 0; j < weaponType.motions[i].power.length; j++) {
							raw.push(pDmg(pwr, weaponType.motions[i].power[j], damage[k].damage[weaponType.motions[i].type[j]]));
							if (elements.length > 1) {
								if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[k].damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
								else { rawE2.push(eDmg(epwr2, damage[k].damage[2 + etype2], modifiers.elem[etype2].eMul, modifiers.elem[etype2].eAdd)); }
							}
							else { rawE.push(eDmg(epwr, damage[k].damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
						}
						calculateRanges();
					}
				}
				return returnRangeVal();
			}
		};
	});

// custom angularjs interpolation markup
calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

// main calculatingPalico controller
calculatingPalico.controller('calculatingPalicoController', function($scope, $http, $q, calculatingPalicoSetup, calculatorService) {
	var promises = [];
	// get weapon types
	/*
	promises.push(
		$http.get('/calculatingpalico/static/weapon_type.json', {cache: true}).then(function(res) {
			$scope.weaponTypes = res.data;
		});
	);
	// get weapon types
	promises.push(
		$http.get('/calculatingpalico/static/weapon_list.json', {cache: true}).then(function(res) {
			$scope.weaponList = res.data;
		});
	);
	// get weapon types
	promises.push(
	$http.get('/calculatingpalico/static/weapon_data.json', {cache: true})
		.then(function(res) {
			$scope.weaponData = res.data;
	});
	// get monster list
	promises.push(
	$http.get('/calculatingpalico/static/monster_list.json', {cache: true})
		.then(function(res) {
			$scope.monsters = res.data;
	});
		);
	// get weapon types
	promises.push(
	$http.get('/calculatingpalico/static/monster_data.json', {cache: true})
		.then(function(res) {
			$scope.monsterData = res.data;
	});
		);
	// get weapon types
	promises.push(
	$http.get('/calculatingpalico/static/modifiers.json', {cache: true})
		.then(function(res) {
			$scope.modifiersRaw = res.data;
	});
		);
	*/
	promises.push($http.get('json/weapon_type.json', {cache: true}));
	promises.push($http.get('json/weapon_list.json', {cache: true}));
	promises.push($http.get('json/weapon_data.json', {cache: true}));
	promises.push($http.get('json/monster_list.json', {cache: true}));
	promises.push($http.get('json/monster_data.json', {cache: true}));
	promises.push($http.get('json/modifiers.json', {cache: true}));

	$q.all(promises).then(function(data) {
		$scope.weaponTypes = data[0].data;
		$scope.weaponList = data[1].data;
		$scope.weaponData = data[2].data;
		$scope.monsters = data[3].data;
		$scope.monsterData = data[4].data;
		$scope.modifiersRaw = data[5].data;

		// define variables for multi-setup tracking
		$scope.storedSetups = [new calculatingPalicoSetup($scope.weaponTypes, $scope.weaponList, $scope.weaponData, $scope.modifiersRaw)];
		$scope.currentSetup = $scope.storedSetups[0];
		$scope.current = 0;
		$scope.counter = [0];
		$scope.countersum = 0;

		// get weapons for chosen weapon type
		$scope.chooseWeaponType = function() {
			$scope.currentSetup.weapons = $scope.currentSetup.updateWeaponList();
			$scope.counter[$scope.current] = 0;
			$scope.countersum = arraySum($scope.counter);
		}

		// get weapon details and weapon type details (motion values) for chosen weapon
		$scope.chooseWeapon = function() {
			$scope.currentSetup.weaponDetails = $scope.currentSetup.updateWeapon();
			$scope.currentSetup.updateWeaponExtras();
			$scope.counter[$scope.current] = 1;
			$scope.countersum = arraySum($scope.counter);

			$scope.currentSetup.weaponTypeDetails = $scope.currentSetup.updateWeaponType();
		}

		// get details for chosen monster
		$scope.updateMonster = function() {
			$scope.monsterDetails = $scope.monsterData[$scope.monsterValue];
			$scope.monsterWeaknesses = [0, 0, 0, 0, 0, 0, 0, 0];
			for (var part in $scope.monsterDetails.damage) {
				for (var i = 0; i < $scope.monsterDetails.damage[part]['damage'].length; i++) {
					$scope.monsterWeaknesses[i] += $scope.monsterDetails.damage[part]['damage'][i];
				}
			}
			for (var i = 0; i < $scope.monsterWeaknesses.length; i++) {
				$scope.monsterWeaknesses[i] = ($scope.monsterWeaknesses[i] / $scope.monsterDetails.damage.length).toFixed(2);
			}
		};

		// function to switch to weapon/modifier setup
		$scope.switchSetup = function(id) {
			$scope.current = id;
			$scope.currentSetup = $scope.storedSetups[id];
		};

		// function to add new blank weapon/modifier setup and switch to it
		$scope.addSetup = function() {
			$scope.storedSetups.push(new calculatingPalicoSetup($scope.weaponTypes, $scope.weaponList, $scope.weaponData, $scope.modifiersRaw));
			$scope.switchSetup($scope.storedSetups.length - 1);
		};

		// function to remove weapon/modifer setup and switch to new first setup in list
		$scope.removeSetup = function(id) {
			$scope.storedSetups.splice(id, 1);
			$scope.switchSetup(0);
		};
	});


	// define calculatorService for damage calculations
	$scope.calcDamage = calculatorService.calcDamage;
});

calculatingPalico.factory("calculatingPalicoSetup", function($http) {
	var customSetup = function(weaponTypesRaw, weaponListRaw, weaponDataRaw, modifiersRaw) {
		this.initialize = function() {
			this.weaponTypeValue = 0;
			this.sharpnessCSS = '';
			this.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];

			this.modSummary = {
				'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false,
				'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
			};

			this.weaponTypes = weaponTypesRaw;
			this.weaponList = weaponListRaw;
			this.weaponData = weaponDataRaw;
			this.modifiers = modifiersRaw;
		};

		this.updateWeaponList = function() {
			var temp = [];
			for (var i = 0; i < this.weaponList.length; i++) {
				if (this.weaponList[i].class == this.weaponTypeValue) {
					temp.push(this.weaponList[i]);
				}
			}
			return temp;
		};

		this.updateWeaponType = function() {
			for (var i = 0; i < this.weaponTypes.length; i++) {
				if (this.weaponTypes[i].id == this.weaponTypeValue) {
					return this.weaponTypes[i];
				}
			}
		};

		this.updateWeapon = function() {
			for (var i = 0; i < this.weaponData.length; i++) {
				if (this.weaponData[i].id == this.weaponValue) {
					return this.weaponData[i];
				}
			}
		};

		this.updateWeaponExtras = function() {
			this.weaponElements = this.weaponDetails.elements;
			this.weaponSharpness = this.weaponDetails.sharpness;
			this.weaponSharpnessPlus = this.weaponDetails.sharpness_plus;
			this.weaponSharpnessDisplay = []
			this.weaponSharpnessScale = [];
			this.weaponSharpnessMax = 0;
			this.weaponSharpnessPlusScale = [];
			this.weaponSharpnessPlusMax = 0;
			for (var i = 0; i < this.weaponSharpness.length; i++) {
				if (this.weaponSharpness[i] > 0) {
					this.weaponSharpnessScale.push({'id': i, 'name': this.sharpnesses[i]});
					this.weaponSharpnessMax = i + 0;
					this.weaponSharpnessPlusScale.push({'id': i, 'name': this.sharpnesses[i]});
					this.weaponSharpnessPlusMax = i + 0;
				}
				else if (this.weaponSharpnessPlus[i] > 0) {
					this.weaponSharpnessPlusScale.push({'id': i, 'name': this.sharpnesses[i]});
					this.weaponSharpnessPlusMax = i + 0;
				}
			}
			this.updateSharpnessRange();
		};

		this.updateSharpnessRange = function() {
			if (this.modifiers['groupSharpness']['sharpness']['on'] == true || this.modifiers['groupF']['hb']['on'] == true) {
				this.weaponSharpnessDisplay = this.weaponSharpnessPlusScale;
				this.sharpnessValue = this.weaponSharpnessPlusMax;
				this.sharpnessCSS = '-active';
			}
			else {
				this.weaponSharpnessDisplay = this.weaponSharpnessScale;
				this.sharpnessValue = this.weaponSharpnessMax;
				this.sharpnessCSS = '';
			}
		};

		this.updateModifiers = function(group, id) {
			if (group == 'groupAwaken') {
				if (this.modifiers['groupAwaken']['awaken']['on'] == true) {
					this.modifiers['groupAwaken']['awaken']['on'] = false;
				}
				else {
					this.modifiers['groupAwaken']['awaken']['on'] = true;
					this.modifiers['groupElem']['arc']['on'] = false;
				}
			}
			else if (group == 'groupSharpness') {
				if (this.modifiers['groupSharpness']['sharpness']['on'] == true) {
					this.modifiers['groupSharpness']['sharpness']['on'] = false;
				}
				else {
					this.modifiers['groupSharpness']['sharpness']['on'] = true;
					this.modifiers['groupF']['hb']['on'] = false;
				}
				this.updateSharpnessRange();
			}
			else if (group == 'groupWeakEx') {
				if (this.modifiers['groupWeakEx']['weakex']['on'] == true) {
					this.modifiers['groupWeakEx']['weakex']['on'] = false;
				}
				else {
					this.modifiers['groupWeakEx']['weakex']['on'] = true;
					this.modifiers['groupExpert']['ruth']['on'] = false;
				}
			}
			else {
				for (var key in this.modifiers[group]) {
					if (this.modifiers[group].hasOwnProperty(key)) {
						if (key == id) {
							if (this.modifiers[group][key]['on'] == true) { this.modifiers[group][key]['on'] = false; }
							else { this.modifiers[group][key]['on'] = true; }
						}
						else { this.modifiers[group][key]['on'] = false; }
					}
				}
				if (id == 'hb') {
					this.modifiers['groupSharpness']['sharpness']['on'] = false;
					this.updateSharpnessRange();
				}
				else if (id == 'arc') {
					this.modifiers['groupAwaken']['awaken']['on'] = false;
				}
				else if (id == 'ruth') {
					this.modifiers['groupWeakEx']['weakex']['on'] = false;
				}
			}
			this.calculateModifiers();
		}

		this.calculateModifiers = function() {
			this.modSummary = {
				'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false,
				'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
			};
			for (var group in this.modifiers) {
				for (var key in this.modifiers[group]) {
					if (this.modifiers[group][key]['on'] == true) {
						this.modSummary['pAdd'] += this.modifiers[group][key]['dAdd'];
						this.modSummary['pMul'] += this.modifiers[group][key]['dMul'];
						this.modSummary['aff'] += this.modifiers[group][key]['aff'];
						for (var i = 1; i < this.modSummary.elem.length; i++) {
							if (this.modifiers[group][key]['eType'] == 0) {
								this.modSummary.elem[i]['eAdd'] += this.modifiers[group][key]['eAdd'];
								this.modSummary.elem[i]['eMul'] += this.modifiers[group][key]['eMul'];
							}
							else if (i == this.modifiers[group][key]['eType']) {
								this.modSummary.elem[i]['eAdd'] += this.modifiers[group][key]['eAdd'];
								this.modSummary.elem[i]['eMul'] += this.modifiers[group][key]['eMul'];
							}
						}
					}
				}
			}
			if (this.modifiers['groupVirus']['vo']['on'] == true) {
				this.modSummary['virusovercome'] = true;
			}
			if (this.modifiers['groupWeakEx']['weakex']['on'] == true || this.modifiers['groupExpert']['ruth']['on'] == true) {
				this.modSummary['weakex'] = true;
			}
		}

		this.initialize();
	};

	return customSetup;
});
