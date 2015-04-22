// function for summing up numeric arrays
arraySum = function (array) {
	return array.reduce(function(a, b) { return a + b; });
}

// toggle -/+ icons for modifier panel
$('.toggle_modifiers').click(function() {
	$(this).find('i').toggleClass('fa-minus-square-o fa-plus-square-o');
});

AddGroupHoverHighlight = function(groupNames) {
	jQuery(document).ready(function($){
			$(groupNames.join(', ')).hover(
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
}

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
				if (affinity > 100) { affinity = 100; }
				return Math.round((((attack / modifier) + modadd) * (1 + 0.25 * (affinity/100)))  * sharpness * (1 + modmul));
			};
			// raw elemental power calculation function
			ePwr = function(attack, sharpness) {
				return Math.round((attack / 10) * sharpness);
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
			
			// special considerations: long swords
			var pMul = modifiers.pMul;
			if (weaponType.id == 2) {
				pMul += (0.1 * modifiers.lsspirit);
			}

			// special considerations: charge blades
			cb_Exp = function(attackName, attack, modifier, modmul, res, phialc, phialt) {
				if (phialt == 'Impact') {
					var modlo = 0.05;
					var modhi = 0.1;
				}
				else if (phialt == 'Element') {
					var modlo = 2.5;
					var modhi = 3.5;
				}
				if (attackName == 'Sword: Return Stroke' || attackName == 'Shield Attack' || attackName == 'Axe: Element Discharge 1' || attackName == 'Axe: Element Discharge 1 (Boost Mode)' || attackName == 'Axe: Dash Element Discharge 1' || attackName == 'Axe: Dash Element Discharge 1 (Boost Mode)') {
					return cb_ExpEq(attack, modifier, 0, res, modlo, 1, 1);
				}
				else if (attackName == 'Axe: Element Discharge 2' || attackName == 'Axe: Element Discharge 2 (Boost Mode)') {
					return cb_ExpEq(attack, modifier, 0, res, modlo, 2, 1);
				}
				else if (attackName == 'Axe: Amped Element Discharge' || attackName == 'Axe: Amped Element Discharge (Boost Mode)') {
					return cb_ExpEq(attack, modifier, 0, res, modhi, 3, 1);
				}
				else if (attackName == 'Axe: Super Amped Element Discharge') {
					return cb_ExpEq(attack, modifier, 0, res, modhi, 3, phialc);
				}
				else {
					return 0;
				}
			};
			
			cb_ExpEq = function(attack, modifier, modmul, res, phialMulti, expCount, phialCount) {
				return Math.round(Math.round((attack / modifier) * (1 + modmul) * (res / 100)) * phialMulti) * expCount * phialCount;
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

			var sharpnessMod = [0.5, 0.75, 1.0, 1.125, 1.25, 1.32, 1.44];
			var sharpnessModE = [0.25, 0.5, 0.75, 1.0, 1.0625, 1.125, 1.2];

			var pwr = pPwr(weapon.attack, affinityBase + modifiers.aff, weapon.modifier, sharpnessMod[sharpness], pMul, modifiers.pAdd);
			// special considerations: switch axes
			if (weaponType.id == 9) {
				var pwrSACharge = pPwr(weapon.attack, affinityBase + modifiers.aff, weapon.modifier, sharpnessMod[sharpness], pMul + 0.2, modifiers.pAdd);
			}
			var epwr = [];
			var etype = [];
			
			for(var i = 0; i < weapon.elements.length; i++) {
				if (weapon.elements[i].awaken_required != 0 && modifiers.awaken != true) {
					continue;
				}
				epwr.push(ePwr(weapon.elements[i].attack, sharpnessModE[sharpness]));
				etype.push(weapon.elements[i]);
			}

			var raw = [];
			var rawE = [];
			for(i = 0; i < epwr.length; i++) {
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
					raw.push(cb_Exp(motion.name, weapon.attack, weapon.modifier, 0, 100, modifiers.phialc, weapon.phial));
				}
				
				if(epwr.length > 0) {
					var elementIndex = 0;
					
					if(!(typeof motion.elements === 'undefined')) {
						elementIndex = motion.elements[i]; // Mainly for dual swords; Use the index of the element based on the motion data.
					}
					
					var elementType = etype[elementIndex].id - 1;
					
					
					if(elementType >= modifiers.elem.length)
					{
						// element Type is one of the various status effects, skip it.
						continue;
					}
					
					var finalElementalPower = epwr[elementIndex];
					
					if (weaponType.id == 1) {
							if (motion.name.indexOf('(Lvl 2)') > -1) {
								finalElementalPower *= 2; // TODO: Get this checked out, I don't think GS doubles or triples it's elemental damage(thing it's closer to 25%/50% more) based on charge
							}
							else if (motion.name.indexOf('(Lvl 3)') > -1) {
								finalElementalPower *= 3;
							}
						}
						// switch axe elemental charge damage
						if (weaponType.id == 9 && weapon.phial == 'Element' && motion.name.indexOf('Sword:') > -1) {
							finalElementalPower *= 1.25;
						}
					
					rawE[elementIndex] += eDmg(finalElementalPower, damage[3 + elementType], 
							modifiers.elem[elementType].eMul, modifiers.elem[elementType].eAdd);
							
					// charge blade elemental phial damage
					if (weaponType.id == 10 && weapon.phial == 'Element') {
						rawE[elementIndex] += cb_Exp(motion.name, weapon.elements[0].attack, 10, 0,
							damage[3 + elementType], modifiers.phialc, weapon.phial);
					}
				}
			}
			var sum = raw.reduce(function(a, b) { return a + b; })
			var totalDamage = sum;
			if(rawE.length > 0) {
				totalDamage += rawE.reduce(function(a, b) { return a + b; });
			}
			
			var returnObject = {
				"physicalDamage" : sum,
				"elementalDamage" : rawE,
				"elementalTypes" : etype,
				"totalDamage" : totalDamage,
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
	});

// custom angularjs interpolation markup
calculatingPalico.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('<%');
	$interpolateProvider.endSymbol('%>');
});

// main calculatingPalico controller
calculatingPalico.controller('calculatingPalicoController', function($scope, $http, $q, calculatingPalicoSetup, calculatorService) {
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

		// define variables for multi-setup tracking
		$scope.storedSetups = [new calculatingPalicoSetup($scope.weaponTypes, $scope.weaponList, $scope.weaponData, JSON.parse(JSON.stringify($scope.modifiersRaw)))];
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
			$scope.storedSetups.push(new calculatingPalicoSetup($scope.weaponTypes, $scope.weaponList, $scope.weaponData, JSON.parse(JSON.stringify($scope.modifiersRaw))));
			$scope.switchSetup($scope.storedSetups.length - 1);
		};

		// function to remove weapon/modifier setup and switch to new first setup in list
		$scope.removeSetup = function(id) {
			$scope.storedSetups.splice(id, 1);
			$scope.switchSetup(0);
		};
		
		var modifierGroups = GenerateModifierGroups($scope.modifiersRaw);
		var skillGroupNames = [];

		for(var groupName in modifierGroups) {
			skillGroupNames.push('.' + groupName);
		}
		
		AddGroupHoverHighlight(skillGroupNames);


	});
	
	$scope.joinTags = function(tags) {
		return tags.join(" ");
	}

	// define calculatorService for damage calculations
	$scope.calcDamage = calculatorService.calcDamage;
	$scope.calcDamageFromRange = calculatorService.calcDamageFromRange;
});

// factory for generating custom setups
calculatingPalico.factory("calculatingPalicoSetup", function($http) {
	var customSetup = function(weaponTypesRaw, weaponListRaw, weaponDataRaw, modifiersRaw) {
		this.initialize = function() {
			this.weaponTypes = weaponTypesRaw;
			this.weaponList = weaponListRaw;
			this.weaponData = weaponDataRaw;
			this.modifiers = GenerateModifiers(modifiersRaw);
			this.modifierGroups = GenerateModifierGroups(modifiersRaw);
			this.usableMoves = [];
			
			this.weaponTypeValue = 0;
			this.sharpnessCSS = '';
			this.sharpnesses = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'White', 'Purple'];

			
			this.modSummary = {
				pAdd: 0, pMul: 0, aff: 0, weakex: false, awaken: false, lsspirit: 0, phialc: 1,
				elem: [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}]
			};
			
			this.ls_spirit_options = [
				{name: 'None', value: 0},
				{name: 'White', value: 1},
				{name: 'Yellow', value: 2},
				{name: 'Red', value: 3}
			];

			this.cb_phial_options = [
				{name: '1', value: 1},
				{name: '2', value: 2},
				{name: '3', value: 3},
				{name: '4', value: 4},
				{name: '5', value: 5},
				{name: '6', value: 6},
			];
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
					this.UpdateUsableMoves(this.weaponDetails, this.weaponTypes[i], this.modSummary)
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
			if (this.modifiers['sharpness'].on == true || this.modifiers['hb'].on == true) {
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
			
				if (group == 'groupSharpness') {
					this.updateSharpnessRange();
				}
			}
			
			this.calculateModifiers();
		}
		
		this.calculateModifiers = function() {
			this.modSummary = {
				pAdd: 0, pMul: 0, aff: 0, weakex: false, awaken: false, lsspirit: 0, phialc: 1,
				elem: [{eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}, {eAdd: 0, eMul: 0}]
			};
			for (var modifierKey in this.modifiers) {
				var modifier = this.modifiers[modifierKey];
				if (modifier.on == true) {
					this.modSummary['pAdd'] += modifier.dAdd;
					this.modSummary['pMul'] += modifier.dMul;
					this.modSummary['aff'] += modifier.aff;
					if (modifier.eType > 0) {
						// this modifier only effects a single element, add it to the relevant counters.
						this.modSummary.elem[modifier.eType].eAdd = modifier.eAdd;
						this.modSummary.elem[modifier.eType].eMul = modifier.eMul;
					}
					else if (modifier.eType == 0)
					{
						// modifiers with type 0 effect all types of elemental attacks. Add their modifiers to all the categories.
						for (var i = 0; i < this.modSummary.elem.length; i++) {
							this.modSummary.elem[i].eAdd = modifier.eAdd;
							this.modSummary.elem[i].eMul = modifier.eMul;
						}
					}
					
					for(var i = 0; i < modifier.effectGroups.length; i++) {
						var groupName = modifier.effectGroups[i];
						if(groupName == 'groupWeakEx') {
							this.modSummary.weakex = true;
						}
						if(groupName == 'groupAwaken') {
							this.modSummary.awaken = true;
						}
					}
				}
			}
			
			this.UpdateUsableMoves(this.weaponDetails, this.weaponTypeDetails, this.modSummary);
		}
		
		this.UpdateUsableMoves = function(weaponDetails, weaponTypeDetails, modSummary) {
			if(weaponTypeDetails.id < 12) {
				// As far as I'm aware no blademaster weapon type has moves that only certain weapons of the class can do.
				// So if it's a blademaster weapon class then just return all the possible moves for that weapon type.
				this.usableMoves = weaponTypeDetails.motions;
			}
			else if (weaponTypeDetails.id == 12 || weaponTypeDetails.id == 13) {
				// 12 is LBG & 13 is HBG. They can share the logic to determine if they can fire specific shot types.
				var retVal = [];
				
				for(var motion in weaponTypeDetails.motions) {
					if(weaponDetails.bowgun_config[motion.shotIndex] > 0) {
						retVal.push(motion);
					}
				}
					
				this.usableMoves = retVal;
			}
			//TODO: Add bows here.
			
		}

		this.initialize();
	};

	return customSetup;
});
