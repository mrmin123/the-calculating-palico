var calculatingPalico = angular.module('calculatingPalico', ['ui.bootstrap'])
	.service('calculatorService', function() {
		this.calcDamage = function(mode, range, elemental, motion, weapon, weaponType, monster, damage, elements, sharpness, modifiers, eindex) {
			pPwr = function(attack, affinity, modifier, sharpness) {
				return (attack * (1 + 0.25 * (affinity/100))) / modifier * sharpness;
			};
			ePwr = function(attack, sharpness) {
				return attack / 10 * sharpness;
			};
			pDmg = function(pwr, motionPower, res) {
				return Math.round(pwr * (motionPower / 100) * (res / 100));
			};
			eDmg = function(pwr, res) {
				return Math.round(pwr * res / 100);
			};
			calculateRanges = function() {
				var sum = raw.reduce(function(a, b) { return a + b; });
				var sumE = rawE.reduce(function(a, b) { return a + b; });
				var sumE2 = rawE2.reduce(function(a, b) { return a + b; })
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

			if (typeof motion === 'undefined' || typeof weapon === 'undefined' || typeof weaponType === 'undefined' || typeof monster === 'undefined' || typeof damage === 'undefined') {
				return '';
			}
			var tempShowValMin = 0;
			var tempShowValMax = 0;
			var tempShowValMinE = 0;
			var tempShowValMaxE = 0;
			var tempShowValMinE2 = 0;
			var tempShowValMaxE2 = 0;

			var sharpnessMod = [0.5, 0.75, 1.0, 1.125, 1.25, 1.32, 1.44];
			var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

			var pwr = pPwr(weapon.attack, weapon.affinity + modifiers.aff, weapon.modifier, sharpnessMod[sharpness]) *  * modifiers.pMul + modifiers.pAdd;
			var epwr = 0;
			var etype = 0
			var epwr2 = 0;;
			var etype2 = 0;
			if (elements.length == 1) {
				if (elements[0].id < 6) {
					element_toggle = 1;
					epwr = ePwr(elements[0].attack, sharpnessModE[sharpness]);
					etype = elements[0].id;
				}
			}
			else if (elements.length == 2) {
				if (elements[0].id < 6) {
					element_toggle = 1;
					epwr = ePwr(elements[0].attack, sharpnessModE[sharpness]);
					etype = elements[0].id;
				}
				if (elements[1].id < 6) {
					element_toggle = 1;
					epwr = ePwr(elements[1].attack, sharpnessModE[sharpness]);
					etype2 = elements[1].id;
				}
			}
			var raw = [0];
			var rawE = [0];
			var rawE2 = [0];
			var rangeMin = 0;
			var rangeMax = 0;
			if (mode == 'specific') {
				for (i = 0; i < motion.power.length; i++) {
					raw.push(pDmg(pwr, motion.power[i], damage[motion.type[i]]));
					if (elements.length > 1) {
						if (i % 2 == 0) { rawE.push(eDmg(epwr, damage[2 + etype])); }
						else { rawE2.push(eDmg(epwr2, damage[2 + etype2])); }
					}
					else { rawE.push(eDmg(epwr, damage[2 + etype])); }
				}
				var sum = raw.reduce(function(a, b) { return a + b; })
				var sumE = rawE.reduce(function(a, b) { return a + b; })
				var sumE2 = rawE2.reduce(function(a, b) { return a + b; })
				if (elemental == 0) {return sum; }
				else if (elemental == 1) {
					if (eindex == 0) return '+' + sumE;
					else if (eindex == 1) return '+' + sumE2;
				}
			}
			else if (mode == 'perPart') {
				for (i = 0; i < weaponType.motions.length; i++) {
					raw = [0];
					rawE = [0];
					rawE2 = [0];
					for (j = 0; j < weaponType.motions[i].power.length; j++) {
						raw.push(pDmg(pwr, weaponType.motions[i].power[j], damage[weaponType.motions[i].type[j]]));
						if (elements.length > 1) {
							if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[2 + etype])); }
							else { rawE2.push(eDmg(epwr2, damage[2 + etype2])); }
						}
						else { rawE.push(eDmg(epwr, damage[2 + etype])); }
					}
					calculateRanges();
				}
				return returnRangeVal();
			}
			else if (mode == 'perMove') {
				for (i = 0; i < damage.length; i++) {
					raw = [0];
					rawE = [0];
					rawE2 = [0];
					for (j = 0; j < motion.power.length; j++) {
						raw.push(pDmg(pwr, motion.power[j], damage[i].damage[motion.type[j]]));
						if (elements.length > 1) {
							if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[i].damage[2 + etype])); }
							else { rawE2.push(eDmg(epwr, damage[i].damage[2 + etype2])); }
						}
						else { rawE.push(eDmg(epwr, damage[i].damage[2 + etype])); }
					}
					calculateRanges();
				}
				return returnRangeVal();
			}
			else if (mode == 'all') {
				for (k = 0; k < damage.length; k ++) {
					for (i = 0; i < weaponType.motions.length; i++) {
						raw = [0];
						rawE = [0];
						rawE2 = [0];
						for (j = 0; j < weaponType.motions[i].power.length; j++) {
							raw.push(pDmg(pwr, weaponType.motions[i].power[j], damage[k].damage[weaponType.motions[i].type[j]]));
							if (elements.length > 1) {
								if (j % 2 == 0) { rawE.push(eDmg(epwr, damage[k].damage[2 + etype])); }
								else { rawE2.push(eDmg(epwr2, damage[k].damage[2 + etype2])); }
							}
							else { rawE.push(eDmg(epwr, damage[k].damage[2 + etype])); }
						}
						calculateRanges();
					}
				}
				return returnRangeVal();
			}
		};
	});

calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

calculatingPalico.controller('calculatingPalicoController', function($scope, $http, calculatorService) {
	$scope.weaponSet = false;
	$scope.monsterSet = false;
	$scope.modSummary = { 'pAdd': 0, 'pMul': 1, 'aff': 0 };
	$scope.sharpnessCSS = '';
	$scope.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];
	$scope.modifiers = {
		'awaken': false,
		'sharpness': false,
		'groupA': {
			'pc': [false, 'pwr_add', 6, 0]
		},
		'groupB': {
			'pt': [false, 'pwr_add', 9, 0]
		},
		'groupC': {
			'dd': [false, 'pwr_add', 5, 0],
			'mdd': [false, 'pwr_add', 7, 0],
			'aupsk': [false, 'pwr_add', 3, 0],
			'aupmk': [false, 'pwr_add', 5, 0],
			'auplk': [false, 'pwr_add', 7, 0]
		},
		'groupD': {
			'ms': [false, 'pwr_add', 10, 0],
			'mp': [false, 'pwr_add', 25, 0],
			'es': [false, 'pwr_add', 20, 0],
			'dh': [false, 'pwr_add', 10, 0]
		},
		'groupF': {
			'aupss': [false, 'pwr_add', 10, 0],
			'aupms': [false, 'pwr_add', 15, 0],
			'aupls': [false, 'pwr_add', 20, 0],
			'aupxls': [false, 'pwr_add', 25, 0],
			'hb': [false, 'pwr_add', 20, 0]
		},
		'groupG': {
			'ad': [false, 'pwr_mul', 1.3, 0],
			'fh': [false, 'pwr_mul', 1.35, 0]
		},
		'groupH': {
			'aupshh': [false, 'pwr_mul', 1.1, 0],
			'aupshhe': [false, 'pwr_mul', 1.15, 0],
			'auplhh': [false, 'pwr_mul', 1.15, 0],
			'auplhhe': [false, 'pwr_mul', 1.20, 0]
		},
		'groupI': {
			'fort1': [false, 'pwr_mul', 1.1, 0],
			'fort2': [false, 'pwr_mul', 1.2, 0]
		},
		'groupJ': {
			'chal1': [false, 'pwr_add', 10, 10],
			'chal2': [false, 'pwr_add', 25, 20],
		},
		'groupExpert': {
			'critgod': [false, 'pwr_add', 0, 30],
			'crit3': [false, 'pwr_add', 0, 20],
			'crit2': [false, 'pwr_add', 0, 15],
			'crit1': [false, 'pwr_add', 0, 10],
			'critn1': [false, 'pwr_add', 0, -10],
			'critn2': [false, 'pwr_add', 0, -15],
			'critn3': [false, 'pwr_add', 0, -20]
		}
	};

	$http.get('/calculatingpalico/weapon_types/')
		.then(function(res) {
			$scope.weaponTypes = res.data;
		});

	$scope.$watch('weaponTypes', function() {
		$http.get('/calculatingpalico/weapons/')
			.then(function(res) {
				$scope.weaponTypes = res.data;
			});
	});

	$http.get('/calculatingpalico/monsters/')
		.then(function(res) {
			$scope.monsters = res.data;
		});

	$scope.updateWeaponList = function() {
		$http.get('/calculatingpalico/weapons/' + $scope.weaponTypeValue)
			.then(function(res) {
				$scope.weapons = res.data;
			});
	}

	$scope.updateSharpnessRange = function() {
		if ($scope.modifiers['sharpness'] == true || $scope.modifiers['groupF']['hb'][0] == true) {
			$scope.weaponSharpnessDisplay = $scope.weaponSharpnessPlusScale;
			$scope.sharpnessValue = $scope.weaponSharpnessPlusMax;
			$scope.sharpnessCSS = '-active';
		}
		else {
			$scope.weaponSharpnessDisplay = $scope.weaponSharpnessScale;
			$scope.sharpnessValue = $scope.weaponSharpnessMax;
			$scope.sharpnessCSS = '';
		}
	}

	$scope.updateWeapon = function() {
		$http.get('/calculatingpalico/weapon/' + $scope.weaponValue)
			.then(function(res) {
				$scope.weaponSet = true;
				$scope.weaponDetails = res.data;
				$scope.weaponElements = $scope.weaponDetails.elements;
				$scope.weaponSharpness = $scope.weaponDetails.sharpness;
				$scope.weaponSharpnessPlus = $scope.weaponDetails.sharpness_plus;
				$scope.weaponSharpnessDisplay = []
				$scope.weaponSharpnessScale = [];
				$scope.weaponSharpnessMax = 0;
				$scope.weaponSharpnessPlusScale = [];
				$scope.weaponSharpnessPlusMax = 0;
				for (var i = 0; i < $scope.weaponSharpness.length; i++) {
					if ($scope.weaponSharpness[i] > 0) {
						$scope.weaponSharpnessScale.push({'id': i, 'name': $scope.sharpnesses[i]});
						$scope.weaponSharpnessMax = i + 0;
						$scope.weaponSharpnessPlusScale.push({'id': i, 'name': $scope.sharpnesses[i]});
						$scope.weaponSharpnessPlusMax = i + 0;
					}
					else if ($scope.weaponSharpnessPlus[i] > 0) {
						$scope.weaponSharpnessPlusScale.push({'id': i, 'name': $scope.sharpnesses[i]});
						$scope.weaponSharpnessPlusMax = i + 0;
					}
				}
				$scope.updateSharpnessRange();
			});
		$http.get('/calculatingpalico/weapon_types/' + $scope.weaponTypeValue)
			.then(function(res) {
				$scope.weaponTypeDetails = res.data;
			});
	}

	$scope.updateMonster = function() {
		$http.get('/calculatingpalico/monster/' + $scope.monsterValue)
			.then(function(res) {
				$scope.monsterSet = true;
				$scope.monsterDetails = res.data;
			});
	}

	$scope.updateModifiers = function(group, id) {
		if (group == 'awoken') {
		}
		else if (group == 'sharpness') {
			$scope.modifiers['groupF']['hb'][0] = false;
			$scope.updateSharpnessRange();
		}
		else {
			for (var key in $scope.modifiers[group]) {
				if ($scope.modifiers[group].hasOwnProperty(key)) {
					if (key == id) {
						if ($scope.modifiers[group][key][0] == true) { $scope.modifiers[group][key][0] = false; }
						else { $scope.modifiers[group][key][0] = true; }
					}
					else { $scope.modifiers[group][key][0] = false; }
				}
			}
			if (id == 'hb') {
				$scope.modifiers['sharpness'] = false;
				$scope.updateSharpnessRange();
			}
		}
		$scope.calculateModifiers();
	}

	$scope.calculateModifiers = function() {
		$scope.modSummary = { 'pAdd': 0, 'pMul': 1, 'aff': 0 };
		for (var group in $scope.modifiers) {
			for (var key in $scope.modifiers[group]) {
				if ($scope.modifiers[group][key][0] == true) {
					if ($scope.modifiers[group][key][1] == 'pwr_add') {
						$scope.modSummary.pAdd += $scope.modifiers[group][key][2];
					}
					else if ($scope.modifiers[group][key][1] == 'pwr_mul') {
						$scope.modSummary.pMul *= $scope.modifiers[group][key][2];
					}
					$scope.modSummary.aff += $scope.modifiers[group][key][3];
				}
			}
		}
	}

	$scope.calcDamage = calculatorService.calcDamage;
});
