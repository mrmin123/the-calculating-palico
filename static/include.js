var skillGroups = [
	'.groupSharpness',
	'.groupAwaken',
	'.groupWeakEx',
	'.groupC',
	'.groupD',
	'.groupF',
	'.groupG',
	'.groupH',
	'.groupHE',
	'.groupI',
	'.groupJ',
	'.groupExpert',
	'.groupElem',
	'.groupEFire',
	'.groupEWater',
	'.groupEIce',
	'.groupEThunder',
	'.groupEDragon'
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

var calculatingPalico = angular.module('calculatingPalico', ['ui.bootstrap'])
	.service('calculatorService', function() {
		this.calcDamage = function(mode, range, elemental, motion, weapon, weaponType, monster, damage, elements, sharpness, modifiers, eindex) {
			pPwr = function(attack, affinity, modifier, sharpness, modmul, modadd) {
				if (affinity > 100) { affinity = 100; }
				return (((attack / modifier) + modadd) * (1 + 0.25 * (affinity/100)))  * sharpness * (1 + modmul);
			};
			ePwr = function(attack, sharpness) {
				return (attack / 10) * sharpness;
			};
			pDmg = function(pwr, motionPower, res) {
				if (modifiers.weakex == true && res > 44) { res += 5; }
				return Math.round(pwr * (motionPower / 100) * (res / 100));
			};
			eDmg = function(pwr, res, modmul, modadd) {
				if (modmul > 0.2) { modmul = 0.2; }
				return Math.round(((pwr + (modadd / 10)) * (1 + modmul) ) * (res / 100));
			};

			var tempShowValMin = 0;
			var tempShowValMax = 0;
			var tempShowValMinE = 0;
			var tempShowValMaxE = 0;
			var tempShowValMinE2 = 0;
			var tempShowValMaxE2 = 0;

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

			var sharpnessMod = [0.5, 0.75, 1.0, 1.125, 1.25, 1.32, 1.44];
			var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

			var pwr = pPwr(weapon.attack, weapon.affinity + modifiers.aff, weapon.modifier, sharpnessMod[sharpness], modifiers.pMul, modifiers.pAdd);
			var epwr = 0;
			var etype = 0
			var epwr2 = 0;;
			var etype2 = 0;
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
						if (i % 2 == 0) { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
						else { rawE2.push(eDmg(epwr2, damage[2 + etype2], modifiers.elem[etype2].eMul, modifiers.elem[etype2].eAdd)); }
					}
					else { rawE.push(eDmg(epwr, damage[2 + etype], modifiers.elem[etype].eMul, modifiers.elem[etype].eAdd)); }
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

calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

calculatingPalico.controller('calculatingPalicoController', function($scope, $http, calculatorService) {
	$scope.weaponSet = false;
	$scope.monsterSet = false;
	$scope.modSummary = {
		'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false,
		'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
	};
	$scope.sharpnessCSS = '';
	$scope.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];
	$scope.modifiers = {
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
			'fatkd': {'name': 'Fire Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 1, 'aff': 0, 'desc': 'decrease fire element x0.75'},
		},
		'groupEWater': {
			'watk3': {'name': 'Water Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.15 +90'},
			'watk2': {'name': 'Water Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.1 +60'},
			'watk1': {'name': 'Water Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.05 +40'},
			'watkd': {'name': 'Water Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 2, 'aff': 0, 'desc': 'decrease water element x0.75'},
		},
		'groupEIce': {
			'iatk3': {'name': 'Ice Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.15 +90'},
			'iatk2': {'name': 'Ice Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.1 +60'},
			'iatk1': {'name': 'Ice Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.05 +40'},
			'iatkd': {'name': 'Ice Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 3, 'aff': 0, 'desc': 'decrease ice element x0.75'},
		},
		'groupEThunder': {
			'tatk3': {'name': 'Thunder Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.15 +90'},
			'tatk2': {'name': 'Thunder Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.1 +60'},
			'tatk1': {'name': 'Thunder Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.05 +40'},
			'tatkd': {'name': 'Thunder Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 4, 'aff': 0, 'desc': 'decrease thunder element x0.75'},
		},
		'groupEDragon': {
			'datk3': {'name': 'Dragon Atk +3', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.15 +90'},
			'datk2': {'name': 'Dragon Atk +2', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.1 +60'},
			'datk1': {'name': 'Dragon Atk +1', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.05 +40'},
			'datkd': {'name': 'Dragon Atk Down', 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 5, 'aff': 0, 'desc': 'decrease dragon element x0.75'},
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
		if ($scope.modifiers['groupSharpness']['sharpness']['on'] == true || $scope.modifiers['groupF']['hb']['on'] == true) {
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
	}

	$scope.updateModifiers = function(group, id) {
		if (group == 'groupAwaken') {
			if ($scope.modifiers['groupAwaken']['awaken']['on'] == true) {
				$scope.modifiers['groupAwaken']['awaken']['on'] = false;
			}
			else {
				$scope.modifiers['groupAwaken']['awaken']['on'] = true;
				$scope.modifiers['groupElem']['arc']['on'] = false;
			}
		}
		else if (group == 'groupSharpness') {
			if ($scope.modifiers['groupSharpness']['sharpness']['on'] == true) {
				$scope.modifiers['groupSharpness']['sharpness']['on'] = false;
			}
			else {
				$scope.modifiers['groupSharpness']['sharpness']['on'] = true;
				$scope.modifiers['groupF']['hb']['on'] = false;
			}
			$scope.updateSharpnessRange();
		}
		else if (group == 'groupWeakEx') {
			if ($scope.modifiers['groupWeakEx']['weakex']['on'] == true) {
				$scope.modifiers['groupWeakEx']['weakex']['on'] = false;
			}
			else {
				$scope.modifiers['groupWeakEx']['weakex']['on'] = true;
				$scope.modifiers['groupExpert']['ruth']['on'] = false;
			}
		}
		else {
			for (var key in $scope.modifiers[group]) {
				if ($scope.modifiers[group].hasOwnProperty(key)) {
					if (key == id) {
						if ($scope.modifiers[group][key]['on'] == true) { $scope.modifiers[group][key]['on'] = false; }
						else { $scope.modifiers[group][key]['on'] = true; }
					}
					else { $scope.modifiers[group][key]['on'] = false; }
				}
			}
			if (id == 'hb') {
				$scope.modifiers['groupSharpness']['sharpness']['on'] = false;
				$scope.updateSharpnessRange();
			}
			else if (id == 'arc') {
				$scope.modifiers['groupAwaken']['awaken']['on'] = false;
			}
			else if (id == 'ruth') {
				$scope.modifiers['groupWeakEx']['weakex']['on'] = false;
			}
		}
		$scope.calculateModifiers();
	}

	$scope.calculateModifiers = function() {
		$scope.modSummary = {
			'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false,
			'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
		};
		for (var group in $scope.modifiers) {
			for (var key in $scope.modifiers[group]) {
				if ($scope.modifiers[group][key]['on'] == true) {
					$scope.modSummary['pAdd'] += $scope.modifiers[group][key]['dAdd'];
					$scope.modSummary['pMul'] += $scope.modifiers[group][key]['dMul'];
					$scope.modSummary['aff'] += $scope.modifiers[group][key]['aff'];
					for (var i = 1; i < $scope.modSummary.elem.length; i++) {
						if ($scope.modifiers[group][key]['eType'] == 0) {
							$scope.modSummary.elem[i]['eAdd'] += $scope.modifiers[group][key]['eAdd'];
							$scope.modSummary.elem[i]['eMul'] += $scope.modifiers[group][key]['eMul'];
						}
						else if (i == $scope.modifiers[group][key]['eType']) {
							$scope.modSummary.elem[i]['eAdd'] += $scope.modifiers[group][key]['eAdd'];
							$scope.modSummary.elem[i]['eMul'] += $scope.modifiers[group][key]['eMul'];
						}
					}
				}
			}
		}
		if ($scope.modifiers['groupWeakEx']['weakex']['on'] == true || $scope.modifiers['groupExpert']['ruth']['on'] == true) {
			$scope.modSummary['weakex'] = true;
		}
	}

	$scope.calcDamage = calculatorService.calcDamage;
});
