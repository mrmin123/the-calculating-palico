// sums up numeric arrays
arraySum = function (array) {
	return array.reduce(function(a, b) { return a + b; });
}

// toggles -/+ icons for modifier panel
$('.toggle_modifiers').click(function() {
	$(this).find('i').toggleClass('fa-minus-square-o fa-plus-square-o');
});

GenerateModifiers = function(modifiersRaw) {
	var retVal = {};
	for (var i = 0; i < modifiersRaw.length; i++) {
		var modifier = modifiersRaw[i];
		retVal[modifier.key] = modifier;
	}
	return retVal;
}

GenerateModifierGroups = function(modifiersRaw) {
	var retVal = {};
	for (var i = 0; i < modifiersRaw.length; i++) {
		var modifier = modifiersRaw[i];
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

// gets parameters from url; courtesy of http://stackoverflow.com/questions/11582512/how-to-get-url-parameters-with-javascript/11582513#11582513
function getUrlParam(key) {
	return decodeURIComponent((new RegExp('[?|&]' + key + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

/* angular */
// service for calculating individual damage numbers
var calculatingPalico = angular.module('calculatingPalico', ['ui.bootstrap'])
	.service('calculatorService', function() {
		this.calcDamage = function(motion, weapon, weaponType, damage, sharpness, modifiers) {
			// return blank if any of the parameters are undefined (user hasn't input all necessary values)
			if (typeof motion === 'undefined' || typeof weapon === 'undefined' || typeof weaponType === 'undefined' || typeof damage === 'undefined' || typeof modifiers === 'undefined') {
				return '';
			}

			// raw power calculation function
			pPwr = function(attack, affinity, modifier, sharpness, modmul, modadd) {
				// limit affinity to max 100%
				if (affinity > 100) { affinity = 100; }
				return Math.floor((((attack / modifier) + modadd) * (1 + 0.25 * (affinity/100)))  * sharpness * (1 + modmul));
			}
			// raw elemental power calculation function
			ePwr = function(attack, affinity, ecmod, sharpness) {
				// limit affinity to max 100%; mainly for elemental crit calculations
				if (affinity > 100) { affinity = 100; }
				return Math.floor((attack / 10) * (1 + ecmod * (affinity/100)) * sharpness);
			}
			// true power calculation function
			pDmg = function(pwr, motionPower, res) {
				// modify resistance as needed if Weakness Exploit skill is active
				if (modifiers.wex == true && res > 44) { res += 5; }
				return Math.floor(pwr * (motionPower / 100) * (res / 100));
			}
			// true elemental power calculation function
			eDmg = function(pwr, res, modmul, modadd, emod) {
				// limit elemental damage modifier to max 1.2x
				if (modmul > 0.2) { modmul = 0.2; }
				return Math.floor((pwr * (1 + modmul) + (modadd / 10)) * (res / 100) * emod);
			}

			// special considerations: long swords
			var pMul = modifiers.pMul;
			if (weaponType.id == 2) {
				pMul += (0.1 * modifiers.lsspirit);
			}

			// special considerations: charge blades
			cb_Exp = function(attackName, attack, modifier, modmul, modadd, res, phialc, phialt) {
				if (phialt == 'Impact') {
					var modlo = 0.05;
					var modhi = 0.1;
				}
				else if (phialt == 'Element') {
					var modlo = 2.5;
					var modhi = 3.5;
				}
				if (attackName == 'Sword: Return Stroke' || attackName == 'Shield Attack' || attackName == 'Axe: Element Discharge 1' || attackName == 'Axe: Element Discharge 1 (Boost Mode)' || attackName == 'Axe: Dash Element Discharge 1' || attackName == 'Axe: Dash Element Discharge 1 (Boost Mode)') {
					return cb_ExpEq(attack, modifier, modmul, modadd, res, modlo, 1, 1);
				}
				else if (attackName == 'Axe: Element Discharge 2' || attackName == 'Axe: Element Discharge 2 (Boost Mode)') {
					return cb_ExpEq(attack, modifier, modmul, modadd, res, modlo, 2, 1);
				}
				else if (attackName == 'Axe: Amped Element Discharge' || attackName == 'Axe: Amped Element Discharge (Boost Mode)') {
					return cb_ExpEq(attack, modifier, modmul, modadd, res, modhi, 3, 1);
				}
				else if (attackName == 'Axe: Super Amped Element Discharge') {
					return cb_ExpEq(attack, modifier, modmul, modadd, res, modhi, 3, phialc);
				}
				else {
					return 0;
				}
			};

			cb_ExpEq = function(attack, modifier, modmul, modadd, res, phialMulti, expCount, phialCount) {
				return Math.floor(Math.floor(((attack / modifier) + (modadd / 10)) * (1 + modmul) * (res / 100)) * phialMulti) * expCount * phialCount;
			};

			var affinityBase = 0
			// modify affinity based on frenzy virus modifiers (and frenzy virus weapons)
			if (weapon.affinity_virus != null) {
				if (modifiers.vo == true) affinityBase = Math.abs(weapon.affinity) + weapon.affinity_virus;
				else affinityBase = weapon.affinity + weapon.affinity_virus;
			}
			else {
				if (modifiers.vo == true) affinityBase = weapon.affinity + 15;
				else affinityBase = weapon.affinity;
			}

			var sharpnessMod = [0.5, 0.75, 1.0, 1.05, 1.2, 1.32, 1.45];
			var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

			var pwr = pPwr(weapon.attack, affinityBase + modifiers.aff, weaponType.modifier, sharpnessMod[sharpness], pMul, modifiers.pAdd);
			// special considerations: switch axes
			if (weaponType.id == 9) {
				var pwrSACharge = pPwr(weapon.attack, affinityBase + modifiers.aff, weaponType.modifier, sharpnessMod[sharpness], pMul + 0.2, modifiers.pAdd);
			}
			var epwrs = [];
			var etype = [];
			var ecmod = 0;

			// set Elemental Crit (weapon-type dependent)
			if (modifiers.ec == true) {
				switch (weaponType.id) {
					case 1:
						ecmod = 0.2;
						break;
					case 3:
						ecmod = 0.35;
						break;
					case 4:
						ecmod = 0.35;
						break;
					default:
						ecmod = 0.25;
				}
			}

			for (var i = 0; i < weapon.elements.length; i++) {
				if (weapon.elements[i].id == 0) {
					// skip elemental damage calculation if elemental damage type is None (for relic weapons)
					continue;
				}
				if (weapon.elements[i].awaken_required != 0 && modifiers.awk != true) {
					// skip elemental damage calculation if weapon requires awaken and, but awaken skill is not active
					continue;
				}
				epwrs.push(ePwr(weapon.elements[i].attack, affinityBase + modifiers.aff, ecmod, sharpnessModE[sharpness]));
				etype.push(weapon.elements[i]);
			}

			var raw = [];
			var rawE = [];
			for (i = 0; i < epwrs.length; i++) {
				rawE[i] = 0;
			}
			for (var i = 0; i < motion.power.length; i++) {
				var rawPower = pwr;

				// switch axe charge damage
				if (weaponType.id == 9 && weapon.phial == 'Power' && motion.name.indexOf('Sword:') > -1) {
					rawPower = pwrSACharge;
				}

				// raw damage
				raw.push(pDmg(rawPower, motion.power[i], damage[motion.type[i]]));

				// charge blade phial damage
				if (weaponType.id == 10 && weapon.phial == 'Impact') {
					raw.push(cb_Exp(motion.name, weapon.attack, weaponType.modifier, 0, 0, 100, modifiers.phialc, weapon.phial));
				}

				if (epwrs.length > 0) {
					var elementIndex = 0;
					var emod = 1;
					if (!(typeof motion.emod === 'undefined')) {
						// grab elemental damage modifier from json
						emod = motion.emod[i];
						if (weaponType.id == 9 && weapon.phial != 'Element') {
							// if switch axe phial type is not elemental, do not apply elemental modifier
							emod = 1;
						}
					}
					if (!(typeof motion.element === 'undefined') && epwrs.length > 1) {
						// Mainly for dual swords; Use the index of the element based on the motion data.
						elementIndex = motion.element[i];
					}

					var elementType = etype[elementIndex].id - 1;

					if(elementType >= modifiers.elem.length) {
						// element Type is one of the various status effects, skip it.
						continue;
					}

					rawE[elementIndex] += eDmg(epwrs[elementIndex], damage[3 + elementType],
							modifiers.elem[elementType].eMul, modifiers.elem[elementType].eAdd, emod);

					// charge blade elemental phial damage
					if (weaponType.id == 10 && weapon.phial == 'Element' && weapon.elements[0].id != 0) {
						rawE[elementIndex] += cb_Exp(motion.name, weapon.elements[0].attack, 10, modifiers.elem[elementType].eMul,
							modifiers.elem[elementType].eAdd, damage[3 + elementType], modifiers.phialc, weapon.phial);
					}
				}
			}
			var sum = raw.reduce(function(a, b) { return a + b; })
			var totalDamage = sum;
			if(rawE.length > 0) {
				totalDamage += rawE.reduce(function(a, b) { return a + b; });
			}

			var returnObject = {
				"physicalDamage": sum,
				"elementalDamage": rawE,
				"elementalTypes": etype,
				"totalDamage": totalDamage,
			}

			return returnObject;
		}

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
			for (var i = 0; i < motions.length; i++){
				for (var j = 0; j < damage.length; j++) {
					damageValues.push(this.calcDamage(motions[i], weapon, weaponType, damage[j].damage, sharpness, modifiers));
				}
			}
			var minObject = null;
			var maxObject = null;

			for (var i = 0; i < damageValues.length; i++) {
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
			}

			return returnObject;
		}

		this.calcHeatmapColor = function(min, max, val) {
			var colors = ["heat1", "heat2", "heat3", "heat4", "heat5", "heat6"];
			var increment = (max - min) / 7;
			var index = Math.floor((max - val) / increment);
			var color = "";
			if (index < colors.length) {
				color = colors[index];
			}

			return color;
		}
	});

// custom angularjs interpolation markup
calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

// main calculatingPalico controller
calculatingPalico.controller('calculatingPalicoController', function($scope, $http, $q, calculatingPalicoSetup, calculatorService) {
	// errors messages for th error panel goes here
	$scope.errors = [];
	// get the base url for the calculating palico page
	$scope.baseUrl = location.protocol + '//' + location.host + location.pathname;
	// collapse modifiers panel at page load
	$scope.modPanelCollapse = true;
	// define promises
	var promises = [];
	promises.push($http.get('json/weapon_type.json', {cache: true}));
	promises.push($http.get('json/weapon_list.json', {cache: true}));
	promises.push($http.get('json/weapon_data.json', {cache: true}));
	promises.push($http.get('json/monster_list.json', {cache: true}));
	promises.push($http.get('json/monster_data.json', {cache: true}));
	promises.push($http.get('json/modifiers.json', {cache: true}));
	promises.push($http.get('json/modifier_display_groups.json', {cache: true}));

	// once all promises are met, initialize rest of variables
	$q.all(promises).then(function(data) {
		$scope.weaponTypes = data[0].data;
		$scope.weaponList = data[1].data;
		$scope.weaponData = data[2].data;
		$scope.monsters = data[3].data;
		$scope.monsterData = data[4].data;
		$scope.modifiersRaw = data[5].data;
		$scope.modifierHtmlDisplayGroups = data[6].data;
		$scope.showAggregateDmg = true;

		$scope.current = 0;
		$scope.counter = [0];
		$scope.countersum = 0;

		// function to switch to weapon/modifier setup
		$scope.switchSetup = function(id) {
			$scope.current = id;
			$scope.currentSetup = $scope.storedSetups[id];
		}
		// function to add new blank weapon/modifier setup and switch to it
		$scope.addSetup = function(preset) {
			$scope.storedSetups.push(new calculatingPalicoSetup($scope.weaponTypes, $scope.weaponList, $scope.weaponData, JSON.parse(JSON.stringify($scope.modifiersRaw)), preset));
			$scope.switchSetup($scope.storedSetups.length - 1);
			$scope.joinUrls();
		}
		// function to remove weapon/modifier setup and switch to new first setup in list
		$scope.removeSetup = function(id) {
			$scope.storedSetups.splice(id, 1);
			$scope.switchSetup(0);
			$scope.joinUrls();
		}

		// get weapons for chosen weapon type
		$scope.chooseWeaponType = function() {
			$scope.currentSetup.weapons = $scope.currentSetup.updateWeaponList();
			$scope.counter[$scope.current] = 0;
			$scope.countersum = arraySum($scope.counter);
			$scope.joinUrls();
		}
		// get weapon details and weapon type details (motion values) for chosen weapon
		$scope.chooseWeapon = function() {
			$scope.currentSetup.weaponDetails = $scope.currentSetup.updateWeapon();
			$scope.currentSetup.updateWeaponExtras();
			$scope.counter[$scope.current] = 1;
			$scope.countersum = arraySum($scope.counter);
			$scope.currentSetup.weaponTypeDetails = $scope.currentSetup.updateWeaponType();
			$scope.joinUrls();
		}
		// get details for chosen monster
		$scope.updateMonster = function() {
			$scope.monsterDetails = $scope.monsterData[$scope.monsterValue];
			$scope.monsterStateValue = $scope.monsterDetails.damage_states[0].name;
			$scope.monsterWeaknesses = [
				{'type': 'Cut', 'val': 0, 'count': 0},
				{'type': 'Impact', 'val': 0, 'count': 0},
				{'type': 'Shot', 'val': 0, 'count': 0},
				{'type': 'Fire', 'val': 0, 'count': 0},
				{'type': 'Water', 'val': 0, 'count': 0},
				{'type': 'Ice', 'val': 0, 'count': 0},
				{'type': 'Thunder', 'val': 0, 'count': 0},
				{'type': 'Dragon', 'val': 0, 'count': 0}
			];

			// get sum and count of resistances of monster
			for (var i = 0; i < $scope.monsterDetails.damage_states.length; i++) {
				for (var j = 0; j < $scope.monsterDetails['damage_' + $scope.monsterDetails.damage_states[i].name].length; j++) {
					for (var k = 0; k < $scope.monsterDetails['damage_' + $scope.monsterDetails.damage_states[i].name][j].damage.length; k++) {
						$scope.monsterWeaknesses[k].val += $scope.monsterDetails['damage_' + $scope.monsterDetails.damage_states[i].name][j].damage[k];
						$scope.monsterWeaknesses[k].count += 1;
					}
				}
			}

			// divide total resistance by resistance count for average resistance
			for (var i = 0; i < $scope.monsterWeaknesses.length; i++) {
				$scope.monsterWeaknesses[i].val = ($scope.monsterWeaknesses[i].val / $scope.monsterWeaknesses[i].count).toFixed(2);
			}

			$scope.updateMonsterDamage();
			$scope.joinUrls();
		}

		$scope.updateMonsterDamage = function() {
			$scope.monsterDetails.damage = [];
			for (var i = 0; i < $scope.monsterDetails['damage_' + $scope.monsterStateValue].length; i++) {
				if (typeof $scope.monsterDetails['damage_' + $scope.monsterStateValue][i].broken !== 'undefined') {
					if ($scope.monsterDetails['damage_' + $scope.monsterStateValue][i].broken == true) {
						$scope.monsterDetails.damage.push({'damage': $scope.monsterDetails['damage_' + $scope.monsterStateValue][i].damage_broken});
					}
					else {
						$scope.monsterDetails.damage.push({'damage': $scope.monsterDetails['damage_' + $scope.monsterStateValue][i].damage});
					}
				}
				else {
					$scope.monsterDetails.damage.push({'damage': $scope.monsterDetails['damage_' + $scope.monsterStateValue][i].damage});
				}
			}
		}

		var modifierGroups = GenerateModifierGroups($scope.modifiersRaw);
		var skillGroupNames = [];
		for (var groupName in modifierGroups) {
			skillGroupNames.push('.' + groupName);
		}

		// validates monster url parameter - THIS NEEDS WORK
		$scope.validateMonsterParam = function(param) {
			var stop = false;
			// fail if monster id is larger than size of monster list
			if (parseInt(param) > $scope.monsters.length) stop = true;
			// return validation results
			if (!stop) return true;
			else return false;
		}
		// validates setup (weapons + modifiers) parameter - THIS NEEDS WORK
		$scope.validateSetupParam = function(param) {
			var stop = false;
			var paramSplit = param.split(".");
			// fail if weapon type id is larger than size of weapon type list
			if (parseInt(paramSplit[0]) > $scope.weaponTypes.length) stop = true;
			// fail if weapon id is invalid (???)
			if (parseInt(paramSplit[1]) % 1 !== 0) stop = true;
			// fail if sharpness is invalid (???)
			if (parseInt(paramSplit[2]) % 1 !== 0) stop = true;
			// fail if longsword spirit value is invalid (???)
			if (parseInt(paramSplit[3]) % 1 !== 0) stop = true;
			// fail if charge axe phialcount is invalid (???)
			if (parseInt(paramSplit[4]) % 1 !== 0) stop = true;
			// return validation results
			if (!stop) return true;
			else return false;
		}

		// define variables for multi-setup tracking
		$scope.storedSetups = [];

		// check for parameters in url
		if (location.search.length > 0) {
			if (getUrlParam('m') && getUrlParam('s')) {
				try {
					var inputMonster = JSON.parse(getUrlParam('m'));
					var inputSetups = JSON.parse(getUrlParam('s'));
					// make sure monster param is valid
					if ($scope.validateMonsterParam(inputMonster)) {
						$scope.monsterValue = parseInt(inputMonster);
						$scope.updateMonster();
						for (var i = 0; i < inputSetups.length; i++) {
							// make sure setup param is valid
							if ($scope.validateSetupParam(inputSetups[i])) {
								var paramSplit = inputSetups[i].split(".");
								$scope.addSetup(paramSplit);
								$scope.chooseWeaponType();
								$scope.chooseWeapon();
								$scope.currentSetup.sharpnessValue = parseInt(paramSplit[2]);
								$scope.currentSetup.calculateModifiers();
								$scope.currentSetup.prefillRelicPreset(paramSplit);
							}
							else {
								$scope.errors.push('"' + inputSetups[i] + '" is not a valid custom setup string');
							}
						}
					}
					else {
						$scope.errors.push('"' + inputMonster + '" is not a valid monster entry');
					}
				}
				catch(e) { }
			}
			else {
				$scope.errors.push('invalid custom parameters');
			}
		}

		$scope.joinUrls();

		if ($scope.storedSetups.length == 0) {
			$scope.addSetup();
		}
	});

	// modifier-group highlight functions:
	// sets which group to highlight
	$scope.highlightGroupSelection = [];
	$scope.highlightGroup = function(input) {
		$scope.highlightGroupSelection = input;
	}
	// highlights groups set to be highlighted
	$scope.highlightGroupCheck = function(input) {
		for (var i = 0; i < input.length; i++) {
			for (var j = 0; j < $scope.highlightGroupSelection.length; j++) {
				if ($scope.highlightGroupSelection[j] == input[i]) {
					return 'gray';
				}
			}
		}
	}
	// joins css classes
	$scope.joinTags = function(tags) {
		return tags.join(" ");
	}
	// joins setup urls
	$scope.joinUrls = function() {
		if ($scope.monsterDetails !== undefined) {
			$scope.urlAll = $scope.baseUrl + '?m=' + $scope.monsterDetails.id + '&s=';
			var tempSetupUrls = [];
			var tempSetupUrl = '';
			for (var i = 0; i < $scope.storedSetups.length; i++) {
				if ($scope.storedSetups[i].weaponValue !== undefined) {
					tempSetupUrls.push($scope.storedSetups[i].setupUrl);
					tempSetupUrl = JSON.stringify(tempSetupUrls);
					if ($scope.urlAll.length + tempSetupUrl.length > 2048) {
						break;
					}
				}
			}
			$scope.urlAll += tempSetupUrl;
		}
	}

	// define calculatorService for damage calculations
	$scope.calcDamage = calculatorService.calcDamage;
	$scope.calcDamageFromRange = calculatorService.calcDamageFromRange;
	$scope.calcHeatmapColor = calculatorService.calcHeatmapColor;
});

// factory for generating custom setups
calculatingPalico.factory("calculatingPalicoSetup", function($http) {
	var customSetup = function(weaponTypesRaw, weaponListRaw, weaponDataRaw, modifiersRaw, preset) {
		// initialize setup object
		this.initialize = function() {
			// get data from json calls
			this.weaponTypes = weaponTypesRaw;
			this.weaponList = weaponListRaw;
			this.weaponData = weaponDataRaw;
			// generate modifier/modifier groups
			this.modifiers = GenerateModifiers(modifiersRaw);
			this.modifierGroups = GenerateModifierGroups(modifiersRaw);
			// define per-setup variables
			this.usableMoves = [];
			this.weaponTypeValue = 0;
			this.sharpnessCSS = '';
			this.setupUrl = '';
			this.showUrl = false;
			this.relicSharpnessValue = 6;
			// define sharpness, spirit, and phial options
			this.sharpnesses = [
				{id: 0, name: 'Red'},
				{id: 1, name: 'Orange'},
				{id: 2, name: 'Yellow'},
				{id: 3, name: 'Green'},
				{id: 4, name: 'Blue'},
				{id: 5, name: 'White'},
				{id: 6, name: 'Purple'}
			];
			this.elementalTypes = [
				{id: 0, name: 'None'},
				{id: 1, name: 'Fire'},
				{id: 2, name: 'Water'},
				{id: 3, name: 'Ice'},
				{id: 4, name: 'Thunder'},
				{id: 5, name: 'Dragon'},
				{id: 6, name: 'Poison'},
				{id: 7, name: 'Sleep'},
				{id: 8, name: 'Para'},
				{id: 9, name: 'Blast'}
			];
			this.saxePhials = ['Power', 'Element'];
			this.cbladePhials = ['Impact', 'Element'];
			this.lsSpiritOptions = [
				{name: 'None', value: 0},
				{name: 'White', value: 1},
				{name: 'Yellow', value: 2},
				{name: 'Red', value: 3}
			];
			this.cbPhialOptions = [
				{name: '1', value: 1},
				{name: '2', value: 2},
				{name: '3', value: 3},
				{name: '4', value: 4},
				{name: '5', value: 5},
				{name: '6', value: 6},
			];
			// define setup modifier setting default
			this.modSummary = {
				pAdd: 0, pMul: 0, aff: 0, vo: false, wex: false, awk: false, ec: false, lsspirit: 0, phialc: 1,
				elem: [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}]
			};
			this.calculateModifiers();

			if (preset !== undefined) {
				this.prefillPreset(preset);
			}
		};

		// updates the weapon list when the weapon type selection changes
		this.updateWeaponList = function() {
			var temp = [];
			for (var i = 0; i < this.weaponList.length; i++) {
				if (this.weaponList[i].class == this.weaponTypeValue) {
					temp.push(this.weaponList[i]);
				}
			}
			return temp;
		}
		// updates the the usable movelist when the weapon type selection changes
		this.updateWeaponType = function() {
			for (var i = 0; i < this.weaponTypes.length; i++) {
				if (this.weaponTypes[i].id == this.weaponTypeValue) {
					this.UpdateUsableMoves(this.weaponDetails, this.weaponTypes[i], this.modSummary)
					return this.weaponTypes[i];
				}
			}
		}
		// updates the selected weapon data when the weapon selection changes
		this.updateWeapon = function() {
			for (var i = 0; i < this.weaponData.length; i++) {
				if (this.weaponData[i].id == this.weaponValue) {
					return jQuery.extend(true, {}, this.weaponData[i]);
				}
			}
			// update setup URL when weapon selection is changed
			this.updateUrl();
		}
		// updates displayed weapon data when the weapon selection changes
		this.updateWeaponExtras = function() {
			this.weaponElements = this.weaponDetails.elements;
			this.weaponSharpness = this.weaponDetails.sharpness;
			this.weaponSharpnessPlus = this.weaponDetails.sharpness_plus;
			this.weaponSharpnessDisplay = []
			this.weaponSharpnessScale = [];
			this.weaponSharpnessMax = 0;
			this.weaponSharpnessPlusScale = [];
			this.weaponSharpnessPlusMax = 0;
			// modify the sharpness ranges for the weapon with or without Sharpness +1
			for (var i = 0; i < this.weaponSharpness.length; i++) {
				if (this.weaponSharpness[i] > 0) {
					this.weaponSharpnessScale.push(this.sharpnesses[i]);
					this.weaponSharpnessMax = i + 0;
					this.weaponSharpnessPlusScale.push(this.sharpnesses[i]);
					this.weaponSharpnessPlusMax = i + 0;
				}
				else if (this.weaponSharpnessPlus[i] > 0) {
					this.weaponSharpnessPlusScale.push(this.sharpnesses[i]);
					this.weaponSharpnessPlusMax = i + 0;
				}
			}
			// update the default sharpness value and CSS after the weapon changes
			this.updateSharpnessRange();
		}
		// updates default sharpness value and CSS
		this.updateSharpnessRange = function() {
			if (this.modifiers['shp'].on == true || this.modifiers['hb'].on == true) {
				this.weaponSharpnessDisplay = this.weaponSharpnessPlusScale;
				this.sharpnessValue = this.weaponSharpnessPlusMax;
				this.sharpnessCSS = '-active';
			}
			else {
				this.weaponSharpnessDisplay = this.weaponSharpnessScale;
				this.sharpnessValue = this.weaponSharpnessMax;
				this.sharpnessCSS = '';
			}
			// update setup URL after Sharpness +1 toggle/weapon change
			this.updateUrl();
		}
		this.relicSharpnessUpdate = function() {
			this.weaponSharpnessMax = parseInt(this.relicSharpnessValue);
			this.weaponSharpnessPlusMax = parseInt(this.relicSharpnessValue);
			this.weaponSharpnessPlusScale = [];
			this.weaponSharpnessScale = [];
			for (var i = 0; i <= parseInt(this.relicSharpnessValue); i++) {
				this.weaponSharpnessPlusScale.push(this.sharpnesses[i]);
				this.weaponSharpnessScale.push(this.sharpnesses[i]);
			}
			this.updateSharpnessRange();
		}
		this.relicElementUpdate = function() {
			this.weaponElements[0].name = this.elementalTypes[this.weaponElements[0].id].name;
		}
		// updates setup modifier settings when modifiers are toggled
		this.updateModifiers = function(toggledModifier) {
			for (var i = 0; i < toggledModifier.effectGroups.length; i++) {
				var groupName = toggledModifier.effectGroups[i];
				var group = this.modifierGroups[groupName];

				for (var j = 0; j < group.length; j++) {
					var modifier = group[j];
					if (modifier.key != toggledModifier.key) {
						modifier.on = false;
					}
				}
				if (groupName == 'groupSharpness') {
					// update sharpness information if Sharpness +1 is toggled
					this.updateSharpnessRange();
				}
			}
			// calculate all aggregate modifier settings
			this.calculateModifiers();
		}
		// calculates all aggregate modifier settings
		this.calculateModifiers = function() {
			this.urlMod = '';
			this.urlModArray = [];
			this.modSummary.pAdd = 0;
			this.modSummary.pMul = 0;
			this.modSummary.aff = 0;
			this.modSummary.vo = false;
			this.modSummary.wex = false;
			this.modSummary.awk = false;
			this.modSummary.ec = false;
			this.modSummary.elem = [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}];
			for (var modifierKey in this.modifiers) {
				var modifier = this.modifiers[modifierKey];
				if (modifier.on == true) {
					this.urlModArray.push(modifier.key);
					this.modSummary['pAdd'] += modifier.dAdd;
					this.modSummary['pMul'] += modifier.dMul;
					this.modSummary['aff'] += modifier.aff;
					if (modifier.eType > 0) {
						// this modifier only effects a single element, add it to the relevant counters.
						this.modSummary.elem[modifier.eType - 1].eAdd = modifier.eAdd;
						this.modSummary.elem[modifier.eType - 1].eMul = modifier.eMul;
					}
					else if (modifier.eType == 0) {
						// modifiers with type 0 effect all types of elemental attacks. Add their modifiers to all the categories.
						for (var i = 0; i < this.modSummary.elem.length; i++) {
							this.modSummary.elem[i].eAdd = modifier.eAdd;
							this.modSummary.elem[i].eMul = modifier.eMul;
						}
					}
					for (var i = 0; i < modifier.effectGroups.length; i++) {
						var groupName = modifier.effectGroups[i];
						if (groupName == 'groupVirus') {
							this.modSummary.vo = true;
						}
						if (groupName == 'groupWeakEx') {
							this.modSummary.wex = true;
						}
						if (groupName == 'groupAwaken') {
							this.modSummary.awk = true;
						}
						if (groupName == 'groupElemC') {
							this.modSummary.ec = true;
						}
					}
				}
			}
			if (this.urlModArray.length > 0) {
				this.urlMod = this.urlModArray.join();
			}
			// if the modifiers change (and weapons are defined), update the move list
			if (typeof this.weaponTypes !== 'undefined' && typeof this.weaponTypeDetails !== 'undefined') {
				this.UpdateUsableMoves(this.weaponDetails, this.weaponTypeDetails, this.modSummary);
			}
			// update setup URL on modifier change
			this.updateUrl();
		}
		// updates the setup URL
		this.updateUrl = function() {
			this.setupUrl = '' + this.weaponTypeValue + '.' + this.weaponValue + '.' + this.sharpnessValue + '.' + this.modSummary.lsspirit + '.' + this.modSummary.phialc + '.' + this.urlMod;
			if (this.weaponValue < 0) {
				// additional relic weapon data, if relevant
				this.setupUrl = this.setupUrl + '.' + this.weaponDetails.attack + '.' + this.weaponDetails.affinity + '.' + this.weaponElements[0].id + '.' + this.weaponElements[0].attack + '.' + this.weaponElements[0].awaken_required + '.' + this.relicSharpnessValue;
				if (this.weaponValue == -9) {
					// additional switch axe relic weapon data, if relevant
					this.setupUrl = this.setupUrl + '.' + this.saxePhials.indexOf(this.weaponDetails.phial);
				}
				else if (this.weaponValue == -10) {
					// additional charge blade relic weapon data, if relevant
					this.setupUrl = this.setupUrl + '.' + this.cbladePhials.indexOf(this.weaponDetails.phial);
				}
			}
		}
		this.UpdateUsableMoves = function(weaponDetails, weaponTypeDetails, modSummary) {
			if (weaponTypeDetails.id < 12) {
				// As far as I'm aware no blademaster weapon type has moves that only certain weapons of the class can do.
				// So if it's a blademaster weapon class then just return all the possible moves for that weapon type.
				this.usableMoves = weaponTypeDetails.motions;
			}
			else if (weaponTypeDetails.id == 12 || weaponTypeDetails.id == 13) {
				// 12 is LBG & 13 is HBG. They can share the logic to determine if they can fire specific shot types.
				var retVal = [];
				for (var motion in weaponTypeDetails.motions) {
					if(weaponDetails.bowgun_config[motion.shotIndex] > 0) {
						retVal.push(motion);
					}
				}
				this.usableMoves = retVal;
			}
			//TODO: Add bows here.
		}
		// pre-fill setups from URL
		this.prefillPreset = function(presetSplit) {
			if (presetSplit.length > 5) {
				this.weaponTypeValue = parseInt(presetSplit[0]);
				this.weaponValue = parseInt(presetSplit[1]);
				this.modSummary.lsspirit = parseInt(presetSplit[3]);
				this.modSummary.phialc = parseInt(presetSplit[4]);
				if (presetSplit[5].length > 0) {
					var modifiersSplit = presetSplit[5].split(",");
					for (var i = 0; i < modifiersSplit.length; i++) {
						this.modifiers[modifiersSplit[i]].on = true;
					}
				}
			}
		}
		// pre-fill relic information from URL
		this.prefillRelicPreset = function(presetSplit) {
			if (presetSplit.length > 11 || presetSplit.length == 13) {
				this.weaponDetails.attack = parseInt(presetSplit[6]);
				this.weaponDetails.affinity = parseInt(presetSplit[7]);
				this.weaponElements[0].id = parseInt(presetSplit[8]);
				this.relicElementUpdate();
				this.weaponElements[0].attack = parseInt(presetSplit[9]);
				this.weaponElements[0].awaken_required = parseInt(presetSplit[10]);
				this.relicSharpnessValue = parseInt(presetSplit[11]);
				this.relicSharpnessUpdate();
				if (presetSplit.length > 12) {
					if (this.weaponValue == -9) {
						this.weaponDetails.phial = this.saxePhials[parseInt(presetSplit[12])];
					}
					else if (this.weaponValue == -10) {
						this.weaponDetails.phial = this.cbladePhials[parseInt(presetSplit[12])];
					}
				}
			}
			this.updateUrl();
		}

		this.initialize();
	}
	return customSetup;
});
