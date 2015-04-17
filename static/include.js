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
calculatingPalico.controller('calculatingPalicoController', function($scope, $http, calculatingPalicoSetup, calculatorService) {
	// define variables for multi-setup tracking
	$scope.storedSetups = [new calculatingPalicoSetup()];
	$scope.currentSetup = $scope.storedSetups[0];
	$scope.current = 0;
	$scope.counter = [0];
	$scope.countersum = 0;

	// get weapon types
	$http.get('/calculatingpalico/weapon_types/')
		.then(function(res) {
			$scope.weaponTypes = res.data;
	});

	// get monster types
	$http.get('/calculatingpalico/monsters/')
		.then(function(res) {
			$scope.monsters = res.data;
	});

	// get weapons for chosen weapon type
	$scope.chooseWeaponType = function() {
		$scope.currentSetup.updateWeaponList().then(function(response) {
			$scope.currentSetup.weapons = response;
			$scope.counter[$scope.current] = 0;
			$scope.countersum = arraySum($scope.counter);
		});
	}

	// get weapon details and weapon type details (motion values) for chosen weapon
	$scope.chooseWeapon = function() {
		$scope.currentSetup.updateWeapon().then(function(response) {
			$scope.currentSetup.weaponDetails = response;
			$scope.currentSetup.updateWeaponExtras();
			$scope.counter[$scope.current] = 1;
			$scope.countersum = arraySum($scope.counter);
		});

		$scope.currentSetup.updateWeaponType().then(function(response) {
			$scope.currentSetup.weaponTypeDetails = response;
		});
	}

	// get details for chosen monster
	$scope.updateMonster = function() {
		$http.get('/calculatingpalico/monster/' + $scope.monsterValue)
			.then(function(res) {
				$scope.monsterSet = true;
				$scope.monsterDetails = res.data;
				$scope.monsterWeaknesses = [0, 0, 0, 0, 0, 0, 0, 0];
				for (var part in $scope.monsterDetails.damage) {
					for (var i = 0; i < $scope.monsterDetails.damage[part]['damage'].length; i++) {
						$scope.monsterWeaknesses[i] += $scope.monsterDetails.damage[part]['damage'][i];
					}
				}
				for (var i = 0; i < $scope.monsterWeaknesses.length; i++) {
					$scope.monsterWeaknesses[i] = ($scope.monsterWeaknesses[i] / $scope.monsterDetails.damage.length).toFixed(2);
				}
		});
	};

	// function to switch to weapon/modifier setup
	$scope.switchSetup = function(id) {
		$scope.current = id;
		$scope.currentSetup = $scope.storedSetups[id];
	};

	// function to add new blank weapon/modifier setup and switch to it
	$scope.addSetup = function() {
		$scope.storedSetups.push(new calculatingPalicoSetup());
		$scope.switchSetup($scope.storedSetups.length - 1);
	};

	// function to remove weapon/modifer setup and switch to new first setup in list
	$scope.removeSetup = function(id) {
		$scope.storedSetups.splice(id, 1);
		$scope.switchSetup(0);
	};

	// define calculatorService for damage calculations
	$scope.calcDamage = calculatorService.calcDamage;
});

calculatingPalico.factory("calculatingPalicoSetup", function($q, $http) {
	var customSetup = function() {
		this.initialize = function() {
			this.weaponTypeValue = 0;
			this.sharpnessCSS = '';
			this.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];

			this.modSummary = {
				'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false,
				'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
			};

			this.modifiers = {
				'groupVirus': {
					'vo': {'name': 'Virus Overcome', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases affinity'}
				},
				'groupHoned': {
					'ha': {'name': 'Honed Attack', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'}
				},
				'groupAwaken': {
					'awaken': {'name': 'Awaken', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'adds elemental attributes to certain weapons'}
				},
				'groupSharpness': {
					'sharpness': {'name': 'Sharpness +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases weapon sharpness level'}
				},
				'groupWeakEx': {
					'weakex': {'name': 'Weakness Exploit +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases damage +5% on monster weak points'}
				},
				'groupA': {
					'pc': {'name': 'Powercharm', 'on': false, 'dAdd': 6, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +6'}
				},
				'groupB': {
					'pt': {'name': 'Powertalon', 'on': false, 'dAdd': 9, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +9'}
				},
				'groupC': {
					'dd': {'name': 'Demondrug', 'on': false, 'dAdd': 5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +5 until death'},
					'mdd': {'name': 'Mega Demondrug', 'on': false, 'dAdd': 7, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +7 until death'},
					'aupsk': {'name': 'Attack Up (S)', 'on': false, 'dAdd': 3, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +3 until death'},
					'aupmk': {'name': 'Attack Up (M)', 'on': false, 'dAdd': 5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +5 until death'},
					'auplk': {'name': 'Attack Up (L)', 'on': false, 'dAdd': 7, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +7 until death'}
				},
				'groupD': {
					'ms': {'name': 'Might Seed', 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +10 for 3m'},
					'mp': {'name': 'Might Pill', 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +25 for 20s'},
					'es': {'name': 'Exciteshroom (+Might Seed)', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20 for 20s'},
					'dh': {'name': 'Demon Horn', 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20 for 3m'}
				},
				'groupF': {
					'aupxls': {'name': 'Attack Up (XL)', 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +25'},
					'aupls': {'name': 'Attack Up (L)', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'},
					'aupms': {'name': 'Attack Up (M)', 'on': false, 'dAdd': 15, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +15'},
					'aupss': {'name': 'Attack Up (S)', 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +10'},
					'adnss': {'name': 'Attack Down (S)', 'on': false, 'dAdd': -5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -5'},
					'adnms': {'name': 'Attack Down (M)', 'on': false, 'dAdd': -10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -10'},
					'adnls': {'name': 'Attack Down (L)', 'on': false, 'dAdd': -15, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -15'},
					'hb': {'name': 'Honed Blade', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20; same as Attack Up (L) + Sharpness +1'}
				},
				'groupG': {
					'ad': {'name': 'Adrenaline +2', 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3'},
					'fh': {'name': 'Felyne Heroics', 'on': false, 'dAdd': 0, 'dMul': 0.35, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.35'},
					'wrao': {'name': 'Wrath Awoken', 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3; same as Guts + Adrenaline +2'}
				},
				'groupH': {
					'auplhh': {'name': 'Attack Up (L) Song', 'on': false, 'dAdd': 0, 'dMul': 0.15, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.15 for 90~120s'},
					'auplhhe': {'name': 'Attack Up (L) Song + Encore', 'on': false, 'dAdd': 0, 'dMul': 0.2, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.2 for 150~210s'},
					'aupshh': {'name': 'Attack Up (S) Song', 'on': false, 'dAdd': 0, 'dMul': 0.1, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.1 for 120~150s'},
					'aupshhe': {'name': 'Attack Up (S) Song + Encore', 'on': false, 'dAdd': 0, 'dMul': 0.15, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.15 for 210~270s'}
				},
				'groupHE': {
					'eabs': {'name': 'Elemental Atk Boost Song', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': .15, 'eType': 0, 'aff': 0, 'desc': 'increases all elements x1.15 for 90~120s'},
					'eabse': {'name': 'Elemental Atk Boost Song + Encore', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': .2, 'eMul': 0, 'eType': 0, 'aff': 0, 'desc': 'increases all elements x1.2 for 150~210s'}
				},
				'groupI': {
					'fort2': {'name': 'Fortify +2', 'on': false, 'dAdd': 0, 'dMul': 0.2, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.2'},
					'fort1': {'name': 'Fortify +1', 'on': false, 'dAdd': 0, 'dMul': 0.1, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.1'}
				},
				'groupJ': {
					'chal2': {'name': 'Challenger +2', 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 20, 'desc': 'increases base +25, affinity +20%'},
					'chal1': {'name': 'Challenger +1', 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 10, 'desc': 'increases base +10, affinity +10%'},
					'pru': {'name': 'Prudence', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20; same as Peak Performance + Evade Extender'},
					'pp': {'name': 'Peak Performance', 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'},
					'lp2': {'name': 'Latent Power +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 50, 'desc': 'increases affinity +50%'},
					'lp1': {'name': 'Latent Power +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 30, 'desc': 'increases affinity +30%'}
				},
				'groupCritDraw': {
					'cd': {'name': 'Critical Draw', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 100, 'desc': 'increases affinity to 100% for all draw attacks; NOTE: all attacks assumed to be draw attacks by calculator!'}
				},
				'groupDest': {
					'dest': {'name': 'Destroyer', 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3 on breakable parts; NOTE: all parts assumed breakable by calculator!'}
				},
				'groupExpert': {
					'ruth': {'name': 'Ruthlessness', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 15, 'desc': 'increases damage +5% on monster weakpoints and affinity +15%; same as Weakness Exploit + Critical Eye +2'},
					'critgod': {'name': 'Critical God', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 30, 'desc': 'increases affinity +30%'},
					'crit3': {'name': 'Critical Eye +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 20, 'desc': 'increases affinity +20%'},
					'crit2': {'name': 'Critical Eye +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 15, 'desc': 'increases affinity +15%'},
					'crit1': {'name': 'Critical Eye +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 10, 'desc': 'increases affinity +10%'},
					'critn1': {'name': 'Critical Eye -1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -10, 'desc': 'decrease affinity -10%'},
					'critn2': {'name': 'Critical Eye -2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -15, 'desc': 'decrease affinity -15%'},
					'critn3': {'name': 'Critical Eye -3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -20, 'desc': 'decrease affinity -20%'}
				},
				'groupElem': {
					'amp': {'name': 'Amplify', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1; same as Element Atk Up + Item Use Up'},
					'arc': {'name': 'Arcana', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1; same as Awaken + Element Atk Up + Status Atk Up'},
					'eau': {'name': 'Element Atk Up', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1'},
					'ead': {'name': 'Element Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.1, 'eType': 0, 'aff': 0, 'desc': 'decrease all elements x0.9'}
				},
				'groupEFire': {
					'fatk3': {'name': 'Fire Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.15 +90'},
					'fatk2': {'name': 'Fire Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.1 +60'},
					'fatk1': {'name': 'Fire Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.05 +40'},
					'fatkd': {'name': 'Fire Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 1, 'aff': 0, 'desc': 'decrease fire element x0.75'}
				},
				'groupEWater': {
					'watk3': {'name': 'Water Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.15 +90'},
					'watk2': {'name': 'Water Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.1 +60'},
					'watk1': {'name': 'Water Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.05 +40'},
					'watkd': {'name': 'Water Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 2, 'aff': 0, 'desc': 'decrease water element x0.75'}
				},
				'groupEIce': {
					'iatk3': {'name': 'Ice Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.15 +90'},
					'iatk2': {'name': 'Ice Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.1 +60'},
					'iatk1': {'name': 'Ice Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.05 +40'},
					'iatkd': {'name': 'Ice Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 3, 'aff': 0, 'desc': 'decrease ice element x0.75'}
				},
				'groupEThunder': {
					'tatk3': {'name': 'Thunder Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.15 +90'},
					'tatk2': {'name': 'Thunder Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.1 +60'},
					'tatk1': {'name': 'Thunder Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.05 +40'},
					'tatkd': {'name': 'Thunder Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 4, 'aff': 0, 'desc': 'decrease thunder element x0.75'}
				},
				'groupEDragon': {
					'datk3': {'name': 'Dragon Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.15 +90'},
					'datk2': {'name': 'Dragon Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.1 +60'},
					'datk1': {'name': 'Dragon Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.05 +40'},
					'datkd': {'name': 'Dragon Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 5, 'aff': 0, 'desc': 'decrease dragon element x0.75'}
				}
			};
		};

		this.updateWeaponList = function() {
			var defer = $q.defer();
			$http.get('/calculatingpalico/weapons/' + this.weaponTypeValue)
				.then(function(res) {
					defer.resolve(res.data);
			});
			return defer.promise;
		};

		this.updateWeaponType = function() {
			var defer = $q.defer();
			$http.get('/calculatingpalico/weapon_types/' + this.weaponTypeValue)
				.then(function(res) {
					//this.weaponTypeDetails = res.data;
					defer.resolve(res.data);
			});
			return defer.promise;
		};

		this.updateWeapon = function() {
			var defer = $q.defer();
			$http.get('/calculatingpalico/weapon/' + this.weaponValue)
				.then(function(res) {
					defer.resolve(res.data);
			});
			return defer.promise;
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
