var calcServiceDef = function(){
	this.calcDamage = function(motion, weapon, weaponType, damage, sharpness, modifiers) {
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

		if (typeof motion === 'undefined' || typeof weapon === 'undefined' || typeof weaponType === 'undefined' || typeof damage === 'undefined') {
			return '';
		}

		var sharpnessMod = [0.5, 0.75, 1.0, 1.125, 1.25, 1.32, 1.44];
		var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

		var pwr = pPwr(weapon.attack, weapon.affinity + modifiers.aff, weapon.modifier, sharpnessMod[sharpness], modifiers.pMul, modifiers.pAdd);
		var epwr = [];
		var etype = [];
		
		for(var i = 0; i < weapon.elements.length; i++) {
			if (weapon.elements[i].awaken_required != 0 && modSummary.awaken != true) {
				continue;
			}
			epwr.push(ePwr(weapon.elements[i].attack, sharpnessModE[sharpness]));
			etype.push(weapon.elements[i].id);
		}

		var raw = [];
		var rawE = [];
		for(i = 0; i < epwr.length; i++) {
			rawE[i] = 0;
		}
		for (var i = 0; i < motion.power.length; i++) {
			raw.push(pDmg(pwr, motion.power[i], damage[motion.type[i]]));
			if(epwr.length > 0) {
				 // assuming every motion triggers the next element in the sequence, for single element weapons(most blademaster weapons,)
				 // will only have one element so each motion will trigger that. For dual blades with two elements it will trigger the first 
				 // element on the first strike, second element on the second strike, then back to the first, etc.
				var elementIndex = i % epwr.length;
				var elementType = etype[elementIndex];
				
				if(elementType >= modifiers.elem.length)
				{
					continue;
				}
				
				rawE[elementIndex] += eDmg(epwr[elementIndex], damage[2 + elementType], 
						modifiers.elem[elementType].eMul, modifiers.elem[elementType].eAdd)						
			}
		}
		var sum = raw.reduce(function(a, b) { return a + b; })
		
		var returnObject = {
			"physicalDamage" : sum,
			"elementalDamage" : rawE,
			"elementalTypes" : etype,
			"totalDamage" : sum + rawE.reduce(function(a, b) { return a + b; })
		};
		
		return returnObject;
	};
		
	this.calcDamageFromRange = function(motions, weapon, weaponType, damage, sharpness, modifiers) {		
		if (typeof motions === 'undefined' ){
			return "motions == undefined";
		}
		else if (typeof weaponType === 'undefined'){
			return "weaponType == undefined";
		}
		else if(typeof damage === 'undefined') {
			return "damage == undefined";
		}
		
		var damageValues = [];
		for(var i = 0; i < motions.length; i++){
			for(var j = 0; j < damage.length; j++) {
				damageValues.push(this.calcDamage(motions[i], weapon, weaponType, damage[j].damage, sharpness, modifiers));
			}
		}
		var minObject = null;
		var maxObject = null;
		
		for(var i = 0; i < damageValues.length; i++) {
			if (minObject == null || damageValues[i].totalDamage < minObject.totalDamage) {
				minObject = damageValues[i];
			}
			
			if (maxObject == null || damageValues[i].totalDamage > maxObject.totalDamage) {
				maxObject = damageValues[i];
			}
		}
		
		var returnObject = {
			"max" : maxObject,
			"min" : minObject
		};
		
		return returnObject;
	};
};

var calculatingPalico = angular.module('calculatingPalico', ['ui.bootstrap']);

calculatingPalico.service('calculatorService', calcServiceDef);

calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

var modifierDefinitions = [
	{'name': 'Honed Attack', 'key': 'ha', 'effectGroups': ['groupHoned'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'},
	{'name': 'Awaken', 'key': 'awaken', 'effectGroups': ['groupAwaken'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'adds elemental attributes to certain weapons'},
	{'name': 'Sharpness +1', 'key': 'sharpness', 'effectGroups': ['groupSharpness'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases weapon sharpness level'},
	{'name': 'Weakness Exploit +1', 'key': 'weakex', 'effectGroups': ['groupWeakEx'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases damage +5% on monster weak points'},
	{'name': 'Powercharm', 'key': 'pc', 'effectGroups': ['groupA'], 'on': false, 'dAdd': 6, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +6'},
	{'name': 'Powertalon', 'key': 'pt', 'effectGroups': ['groupB'], 'on': false, 'dAdd': 9, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +9'},
	{'name': 'Demondrug', 'key': 'dd', 'effectGroups': ['groupC'], 'on': false, 'dAdd': 5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +5 until death'},
	{'name': 'Mega Demondrug', 'key': 'mdd', 'effectGroups': ['groupC'], 'on': false, 'dAdd': 7, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +7 until death'},
	{'name': 'Attack Up (S)', 'key': 'aupsk', 'effectGroups': ['groupC'], 'on': false, 'dAdd': 3, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +3 until death'},
	{'name': 'Attack Up (M)', 'key': 'aupmk', 'effectGroups': ['groupC'], 'on': false, 'dAdd': 5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +5 until death'},
	{'name': 'Attack Up (L)', 'key': 'auplk', 'effectGroups': ['groupC'], 'on': false, 'dAdd': 7, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +7 until death'},
	{'name': 'Might Seed', 'key': 'ms', 'effectGroups': ['groupD'], 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +10 for 3m'},
	{'name': 'Might Pill', 'key': 'mp', 'effectGroups': ['groupD'], 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +25 for 20s'},
	{'name': 'Exciteshroom (+Might Seed)', 'key': 'es', 'effectGroups': ['groupD'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20 for 20s'},
	{'name': 'Demon Horn', 'key': 'dh', 'effectGroups': ['groupD'], 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20 for 3m'},
	{'name': 'Attack Up (XL)', 'key': 'aupxls', 'effectGroups': ['groupF'], 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +25'},
	{'name': 'Attack Up (L)', 'key': 'aupls', 'effectGroups': ['groupF'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'},
	{'name': 'Attack Up (M)', 'key': 'aupms', 'effectGroups': ['groupF'], 'on': false, 'dAdd': 15, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +15'},
	{'name': 'Attack Up (S)', 'key': 'aupss', 'effectGroups': ['groupF'], 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +10'},
	{'name': 'Attack Down (S)', 'key': 'adnss', 'effectGroups': ['groupF'], 'on': false, 'dAdd': -5, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -5'},
	{'name': 'Attack Down (M)', 'key': 'adnms', 'effectGroups': ['groupF'], 'on': false, 'dAdd': -10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -10'},
	{'name': 'Attack Down (L)', 'key': 'adnls', 'effectGroups': ['groupF'], 'on': false, 'dAdd': -15, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'decrease base -15'},
	{'name': 'Honed Blade', 'key': 'hb', 'effectGroups': ['groupF', 'groupSharpness'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20; same as Attack Up (L) + Sharpness +1'},
	{'name': 'Adrenaline +2', 'key': 'ad', 'effectGroups': ['groupG'], 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3'},
	{'name': 'Felyne Heroics', 'key': 'fh', 'effectGroups': ['groupG'], 'on': false, 'dAdd': 0, 'dMul': 0.35, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.35'},
	{'name': 'Wrath Awoken', 'key': 'wrao', 'effectGroups': ['groupG'], 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3; same as Guts + Adrenaline +2'},
	{'name': 'Attack Up (L) Song', 'key': 'auplhh', 'effectGroups': ['groupH'], 'on': false, 'dAdd': 0, 'dMul': 0.15, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.15 for 90~120s'},
	{'name': 'Attack Up (L) Song + Encore', 'key': 'auplhhe', 'effectGroups': ['groupH'], 'on': false, 'dAdd': 0, 'dMul': 0.2, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.2 for 150~210s'},
	{'name': 'Attack Up (S) Song', 'key': 'aupshh', 'effectGroups': ['groupH'], 'on': false, 'dAdd': 0, 'dMul': 0.1, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.1 for 120~150s'},
	{'name': 'Attack Up (S) Song + Encore', 'key': 'aupshhe', 'effectGroups': ['groupH'], 'on': false, 'dAdd': 0, 'dMul': 0.15, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.15 for 210~270s'},
	{'name': 'Elemental Atk Boost Song', 'key': 'eabs', 'effectGroups': ['groupHE'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': .15, 'eType': 0, 'aff': 0, 'desc': 'increases all elements x1.15 for 90~120s'},
	{'name': 'Elemental Atk Boost Song + Encore', 'key': 'eabse', 'effectGroups': ['groupHE'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': .2, 'eMul': 0, 'eType': 0, 'aff': 0, 'desc': 'increases all elements x1.2 for 150~210s'},
	{'name': 'Fortify +2', 'key': 'fort2', 'effectGroups': ['groupI'], 'on': false, 'dAdd': 0, 'dMul': 0.2, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.2'},
	{'name': 'Fortify +1', 'key': 'fort1', 'effectGroups': ['groupI'], 'on': false, 'dAdd': 0, 'dMul': 0.1, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.1'},
	{'name': 'Challenger +2', 'key': 'chal2', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 25, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 20, 'desc': 'increases base +25, affinity +20%'},
	{'name': 'Challenger +1', 'key': 'chal1', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 10, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 10, 'desc': 'increases base +10, affinity +10%'},
	{'name': 'Prudence', 'key': 'pru', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20; same as Peak Performance + Evade Extender'},
	{'name': 'Peak Performance', 'key': 'pp', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 20, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base +20'},
	{'name': 'Latent Power +2', 'key': 'lp2', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 50, 'desc': 'increases affinity +50%'},
	{'name': 'Latent Power +1', 'key': 'lp1', 'effectGroups': ['groupJ'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 30, 'desc': 'increases affinity +30%'},
	{'name': 'Critical Draw', 'key': 'cd', 'effectGroups': ['groupCritDraw'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 100, 'desc': 'increases affinity to 100% for all draw attacks; NOTE: all attacks assumed to be draw attacks by calculator!'},
	{'name': 'Destroyer', 'key': 'dest', 'effectGroups': ['groupDest'], 'on': false, 'dAdd': 0, 'dMul': 0.3, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 0, 'desc': 'increases base x1.3 on breakable parts; NOTE: all parts assumed breakable by calculator!'},
	{'name': 'Ruthlessness', 'key': 'ruth', 'effectGroups': ['groupExpert', 'groupWeakEx'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 15, 'desc': 'increases damage +5% on monster weakpoints and affinity +15%; same as Weakness Exploit + Critical Eye +2'},
	{'name': 'Critical God', 'key': 'critgod', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 30, 'desc': 'increases affinity +30%'},
	{'name': 'Critical Eye +3', 'key': 'crit3', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 20, 'desc': 'increases affinity +20%'},
	{'name': 'Critical Eye +2', 'key': 'crit2', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 15, 'desc': 'increases affinity +15%'},
	{'name': 'Critical Eye +1', 'key': 'crit1', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': 10, 'desc': 'increases affinity +10%'},
	{'name': 'Critical Eye -1', 'key': 'critn1', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -10, 'desc': 'decrease affinity -10%'},
	{'name': 'Critical Eye -2', 'key': 'critn2', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -15, 'desc': 'decrease affinity -15%'},
	{'name': 'Critical Eye -3', 'key': 'critn3', 'effectGroups': ['groupExpert'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0, 'eType': -1, 'aff': -20, 'desc': 'decrease affinity -20%'},
	{'name': 'Amplify', 'key': 'amp', 'effectGroups': ['groupElem'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1; same as Element Atk Up + Item Use Up'},
	{'name': 'Arcana', 'key': 'arc', 'effectGroups': ['groupElem', 'groupAwaken'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1; same as Awaken + Element Atk Up + Status Atk Up'},
	{'name': 'Element Atk Up', 'key': 'eau', 'effectGroups': ['groupElem'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': 0.1, 'eType': 0, 'aff': 0, 'desc': 'increase all elements x1.1'},
	{'name': 'Element Atk Down', 'key': 'ead', 'effectGroups': ['groupElem'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.1, 'eType': 0, 'aff': 0, 'desc': 'decrease all elements x0.9'},
	{'name': 'Fire Atk +3', 'key': 'fatk3', 'effectGroups': ['groupEFire'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.15 +90'},
	{'name': 'Fire Atk +2', 'key': 'fatk2', 'effectGroups': ['groupEFire'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.1 +60'},
	{'name': 'Fire Atk +1', 'key': 'fatk1', 'effectGroups': ['groupEFire'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 1, 'aff': 0, 'desc': 'increase fire element x1.05 +40'},
	{'name': 'Fire Atk Down', 'key': 'fatkd', 'effectGroups': ['groupEFire'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 1, 'aff': 0, 'desc': 'decrease fire element x0.75'},
	{'name': 'Water Atk +3', 'key': 'watk3', 'effectGroups': ['groupEWater'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.15 +90'},
	{'name': 'Water Atk +2', 'key': 'watk2', 'effectGroups': ['groupEWater'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.1 +60'},
	{'name': 'Water Atk +1', 'key': 'watk1', 'effectGroups': ['groupEWater'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 2, 'aff': 0, 'desc': 'increase water element x1.05 +40'},
	{'name': 'Water Atk Down', 'key': 'watkd', 'effectGroups': ['groupEWater'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 2, 'aff': 0, 'desc': 'decrease water element x0.75'},
	{'name': 'Ice Atk +3', 'key': 'iatk3', 'effectGroups': ['groupEIce'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.15 +90'},
	{'name': 'Ice Atk +2', 'key': 'iatk2', 'effectGroups': ['groupEIce'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.1 +60'},
	{'name': 'Ice Atk +1', 'key': 'iatk1', 'effectGroups': ['groupEIce'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 3, 'aff': 0, 'desc': 'increase ice element x1.05 +40'},
	{'name': 'Ice Atk Down', 'key': 'iatkd', 'effectGroups': ['groupEIce'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 3, 'aff': 0, 'desc': 'decrease ice element x0.75'},
	{'name': 'Thunder Atk +3', 'key': 'tatk3', 'effectGroups': ['groupEThunder'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.15 +90'},
	{'name': 'Thunder Atk +2', 'key': 'tatk2', 'effectGroups': ['groupEThunder'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.1 +60'},
	{'name': 'Thunder Atk +1', 'key': 'tatk1', 'effectGroups': ['groupEThunder'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 4, 'aff': 0, 'desc': 'increase thunder element x1.05 +40'},
	{'name': 'Thunder Atk Down', 'key': 'tatkd', 'effectGroups': ['groupEThunder'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 4, 'aff': 0, 'desc': 'decrease thunder element x0.75'},
	{'name': 'Dragon Atk +3', 'key': 'datk3', 'effectGroups': ['groupEDragon'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 90, 'eMul': 0.15, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.15 +90'},
	{'name': 'Dragon Atk +2', 'key': 'datk2', 'effectGroups': ['groupEDragon'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 60, 'eMul': 0.1, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.1 +60'},
	{'name': 'Dragon Atk +1', 'key': 'datk1', 'effectGroups': ['groupEDragon'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 40, 'eMul': 0.05, 'eType': 5, 'aff': 0, 'desc': 'increase dragon element x1.05 +40'},
	{'name': 'Dragon Atk Down', 'key': 'datkd', 'effectGroups': ['groupEDragon'], 'on': false, 'dAdd': 0, 'dMul': 0, 'eAdd': 0, 'eMul': -0.25, 'eType': 5, 'aff': 0, 'desc': 'decrease dragon element x0.75'},
]

var modifierHtmlDisplayGroups = [
	[
		{
		'displayName': 'Honed Weapon',
		'modifiers': [
			'ha'
			]
		},
		{
		'displayName': 'Weapon Skills',
		'modifiers': [
			'awaken',
			'sharpness'
			]
		},
		{
		'displayName': 'Items',
		'modifiers': [
			'pc',
			'pt'
			]
		},
		{
		'displayName': 'Consumables',
		'modifiers': [
			'dd',
			'mdd',
			'ms',
			'mp',
			'es',
			'dh'
			]
		},
		{
		'displayName': 'Kitchen Skills',
		'modifiers': [
			'aupsk',
			'aupmk',
			'auplk',
			'fh'
			]
		},
		{
		'displayName': 'Hunting Horn Buffs',
		'modifiers': [
			'auplhhe',
			'auplhh',
			'aupshhe',
			'aupshh',
			'eabse',
			'eabs'
			]
		},
	],
	[
		{
		'displayName': 'Attack Skills',
		'modifiers': [
			'aupxls',
			'aupls',
			'aupms',
			'aupss',
			'adnss',
			'adnms',
			'adnls'
			]
		},
		{
		'displayName': 'Survivor Skills',
		'modifiers': [
			'fort2',
			'fort1'
			]
		},
		{
		'displayName': 'Spirit Skills',
		'modifiers': [
			'chal2',
			'chal1'
			]
		},
		{
		'displayName': 'Gloves Off Skills',
		'modifiers': [
			'lp2',
			'lp1'
			]
		},
		{
		'displayName': 'Expert Skills',
		'modifiers': [
			'critgod',
			'crit3',
			'crit2',
			'crit1',
			'critn1',
			'critn2',
			'critn3'
			]
		},
	],
	[
		{
		'displayName': 'Fire Attack Skills',
		'modifiers': [
			'fatk3',
			'fatk2',
			'fatk1',
			'fatkd'
			]
		},
		{
		'displayName': 'Water Attack Skills',
		'modifiers': [
			'watk3',
			'watk2',
			'watk1',
			'watkd'
			]
		},
		{
		'displayName': 'Ice Attack Skills',
		'modifiers': [
			'iatk3',
			'iatk2',
			'iatk1',
			'iatkd'
			]
		},
		{
		'displayName': 'Thunder Attack Skills',
		'modifiers': [
			'tatk3',
			'tatk2',
			'tatk1',
			'tatkd'
			]
		},
		{
		'displayName': 'Dragon Attack Skills',
		'modifiers': [
			'datk3',
			'datk2',
			'datk1',
			'datkd'
			]
		},
	],
	[
		{
		'displayName': 'Elemental Attack Skills',
		'modifiers': [
			'eau',
			'ead'
			]
		},
		{
		'displayName': 'Combo Skills',
		'modifiers': [
			'hb',
			'arc',
			'amp',
			'pru',
			'wrao',
			'ruth'
			]
		},
		{
		'displayName': 'Misc. Skills',
		'modifiers': [
			'cd',
			'ad',
			'pp',
			'dest',
			'weakex'
			]
		}
	]
];

var GenerateModifiers = function() {
	var retVal = {};
	for (var i = 0; i < modifierDefinitions.length; i++) {
		var modifier = modifierDefinitions[i];
		retVal[modifier.key] = modifier;
	}
	
	return retVal;
}

var GenerateModifierGroups = function() {
	var retVal = {};
	for (var i = 0; i < modifierDefinitions.length; i++) {
		var modifier = modifierDefinitions[i];
		for (var j = 0; j < modifier.effectGroups.length; j++) {
			var group = modifier.effectGroups[j];
			if (!(group in retVal)) {
				retVal[group] = [];
			}
			retVal[group].push(modifier);
		}
	}
	
	return retVal;
}

var modifiers = GenerateModifiers();
var modifierGroups = GenerateModifierGroups();

var cssString = "";

var skillGroupNames = [];

for(var groupName in modifierGroups) {
	skillGroupNames.push('.' + groupName);
}

jQuery(document).ready(function($){
	$(skillGroupNames.join(', ')).hover(
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
});

calculatingPalico.controller('calculatingPalicoController', function($scope, $http, calculatorService) {
	$scope.weaponSet = false;
	$scope.monsterSet = false;
	$scope.modSummary = {
		'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false, 'awaken': false,
		'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
	};
	$scope.sharpnessCSS = '';
	$scope.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];
	$scope.modifierDefinitions = modifierDefinitions;
	$scope.modifierHtmlDisplayGroups = modifierHtmlDisplayGroups;
	$scope.modifiers = modifiers;
	$scope.modifierGroups = modifierGroups;
	
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
		if($scope.weaponTypeValue != null) {
			$http.get('/calculatingpalico/weapons/' + $scope.weaponTypeValue)
				.then(function(res) {
					$scope.weapons = res.data;
				});
		}
	}

	$scope.updateSharpnessRange = function() {
		if ($scope.modifiers['sharpness']['on'] == true || $scope.modifiers['hb']['on'] == true) {
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

	$scope.updateModifiers = function(id) {
		for (var group in $scope.modifiers[id].effectGroups) {
			for (var modifier in $scope.modifierGroups[group]) {
				if (modifier.key == id) {
					modifier.on = !modifier.on; // toggle the modifier this function was called for.
				}
				else { 
					modifier.on = false; 
				}
			}
		
			if (group == 'groupSharpness') {
				$scope.updateSharpnessRange();
			}
		}
		
		$scope.calculateModifiers();
	}
		
	$scope.calculateModifiers = function() {
		$scope.modSummary = {
			'pAdd': 0, 'pMul': 1, 'aff': 0, 'weakex': false, 'awaken': false,
			'elem': [{'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}, {'eAdd': 0, 'eMul': 0}]
		};
		for (var modifier in $scope.modifiers) {
			if (modifier.on == true) {
				$scope.modSummary['pAdd'] += modifier.dAdd;
				$scope.modSummary['pMul'] += modifier.dMul;
				$scope.modSummary['aff'] += modifier.aff;
				if (modifier.eType > 0) {
					// this modifier only effects a single element, add it to the relevant counters.
					$scope.modSummary.elem[modifier.eType].eAdd = modifier.eAdd;
					$scope.modSummary.elem[modifier.eType].eMul = modifier.eMul;
				}
				else if (modifier.eType == 0)
				{
					// modifiers with type 0 effect all types of elemental attacks. Add their modifiers to all the categories.
					for (var i = 0; i < $scope.modSummary.elem.length; i++) {
						$scope.modSummary.elem[i].eAdd = modifier.eAdd;
						$scope.modSummary.elem[i].eMul = modifier.eMul;
					}
				}
				
				for(var group in modifier.effectGroups) {
					if(group == 'groupWeakEx') {
						$scope.modSummary.weakex = true;
					}
					if(group == 'groupAwaken') {
						$scope.modSummary.awaken = true;
					}
				}
			}
		}
	}

	$scope.calcDamage = calculatorService.calcDamage;
	$scope.calcDamageFromRange = calculatorService.calcDamageFromRange;

	$scope.usableMoves = [];
	
	$scope.UpdateUsableMoves = function(weaponDetails, weaponTypeDetails, modSummary) {
		if(weaponTypeDetails.id < 12) {
			// As far as I'm aware no blademaster weapon type has moves that only certain weapons of the class can do.
			// So if it's a blademaster weapon class then just return all the possible moves for that weapon type.
			$scope.usableMoves = weaponTypeDetails.motions; 
		}
		else if (weaponTypeDetails.id < 14) {
			// 12 is LBG & 13 is HBG. They can share the logic to determine if they can fire specific shot types.
			var retVal = [];
			
			for(var motion in weaponTypeDetails.motions) {
				if(weaponDetails.bowgun_config[motion.shotIndex] > 0) {
					retVal.push(motion);
				}
			}
			
			$scope.usableMoves = retVal;
		}
		//TODO: Add bows here.
	}
	
	$scope.joinTags = function(tags) {
		return tags.join(" ");
	}

});
