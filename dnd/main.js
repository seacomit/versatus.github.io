let renderFn = null;
let playerLevel = 1;
let effectPowerPool = 0;
let selectedEffect = null;
let rCount = 1;
let sCount = 0;
let uCount = 0;
let rUCount = 0;
let sUCount = 0;
let uUCount = 0;

let effectAmountMultiplier = 1;
let diceAmount = 1;
let diceSides = 6;
let diceAdder = 0;
let effectRounds = 1;

let isPositive = true;
let elToFocus = "levelInput";

let addedEffects = [];

const EffectValueType = {
   Dice: "Dice",
   Rounds: "Rounds",
   Amount: "Amount",
}

class AbilityCounts {
   constructor(r,s,u, rU, sU, uU) {
      this.r = r;
      this.s = s;
      this.u = u;
      this.rU = rU;
      this.sU = sU;
      this.uU = uU;
   }
}

class EffectInstance {
   constructor(effect, multiplier, isPositive, diceAmount, diceSides, diceAdder, effectRounds) {
      this.effect = effect;
      this.multiplier = multiplier;
      this.isPositive = isPositive;
      this.diceAmount = diceAmount;
      this.diceSides = diceSides;
      this.diceAdder = diceAdder;
      this.effectRounds = effectRounds;
   }
   
   getEffectPower() {
      let value = 0;
      if (this.effect.effectValueType == EffectValueType.Dice) {
         value = (((Number(this.diceAmount) * Number(this.diceSides) / 2) + (Number(this.diceAmount) / 2))
                 + Number(this.diceAdder)) *
             this.effect.effectPowerInc;
      } else {
         value = (this.effect.effectPowerInc * this.multiplier);
      }
      if (this.effect.effectPowerMod) {
         value += this.effect.effectPowerMod;
      }
      value *= this.effectRounds;
      if (!this.isPositive) value *= -1;
      return value;
   }
   
   toString() {
      let value = "";
      if (this.effect.effectValueType == EffectValueType.Dice) {
         value = `${this.diceAmount}d${this.diceSides} ${this.diceAdder == "0" ? "" : "+" + this.diceAdder} ${this.effect.toString()}`;
      } else {
         value = this.getEffectPower() + " " + this.effect.toString();
      }
      if (this.effect.effectValueType == EffectValueType.Rounds) {
         value += ` (${this.multiplier} rounds)`;
      } else if (this.effect.effectValueType == EffectValueType.Amount) {
         value += ` (${this.effectRounds} rounds)`;
      } else {
         if (this.effectRounds > 1) {
            value += ` (${this.effectRounds} rounds)`;
         }
      }
      return value;
   }
}

// Defines an effect type, like inflict damage, heal, stun, slow, fly etc. 
class EffectType {
   constructor(effectValueType, name, valueInc, effectPowerInc, effectPowerMod, id=0) {
      this.effectValueType = effectValueType;
      this.name = name;
      this.valueInc = valueInc;
      this.effectPowerInc = effectPowerInc;
      this.effectPowerMod = effectPowerMod;
      this.id = id;
   }
   
   toString() {
      let nameStr = this.name;
      return nameStr;
   }
}

function generateEffectTypesList() {
   const effectTypes = [];
   
   // Damage and Heal Effects
   effectTypes.push(new EffectType(EffectValueType.Dice,"Damage", 1, 1));
   effectTypes.push(new EffectType(EffectValueType.Dice, "+Weapon Damage", 1, 1.5));
   effectTypes.push(new EffectType(EffectValueType.Dice, "AoE Damage(2x2)", 1,  1.5));
   effectTypes.push(new EffectType(EffectValueType.Dice, "AoE Damage(3x3)", 1, 2));
   effectTypes.push(new EffectType(EffectValueType.Dice, "AoE Damage(4x4)", 1, 3));
   effectTypes.push(new EffectType(EffectValueType.Dice, "AoE Damage(5x5)", 1, 4));
   effectTypes.push(new EffectType(EffectValueType.Dice, "Heal", 1, 1));
   
   // Hit and Armor Effects
   effectTypes.push(new EffectType(EffectValueType.Amount, "+Hit", 1, 4.5, -0.5));
   effectTypes.push(new EffectType(EffectValueType.Amount, "+AC", 1, 4.5, -0.5));
   
   // Miscellaneous Effects 
   effectTypes.push(new EffectType(EffectValueType.Rounds, "Invisibility", 1, 9));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Flight", 1, 13));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Stun(Unbreakable)", 1, 13));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Stun(Breakable)", 1, 7));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Control", 1, 26));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Confuse", 1, 14));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Move twice", 1, 13));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Move 1 squares", 1, 4));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Pull (n feet)", 1, 13));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Knockback", 1, 7));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Slow (-1ac, -1hit, -1sqr)", 1, 9));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Invulnerability", 1, 26));
   effectTypes.push(new EffectType(EffectValueType.Rounds,"Reflect", 1, 13));
   
   // Generate IDs for the effects.
   effectTypes.forEach((effect, index) => {
      effectTypes[index].id = index + 1;
   });
   
   return effectTypes;
}

function getAbilityCounts(level) {
   // We start with two regular abilities.
   let regularAbilityCount = 2; // CEIL(* 0.1)
   let specialAbilityCount = 0;
   let ultimateAbilityCount = 0;

   let regularAbilityUpgrades = 0;
   let specialAbilityUpgrades = 0;
   let ultimateAbilityUpgrades = 0;

   // For every 4 levels we get 1 extra regular ability and 1 upgrade.
   const extraRegularAbilitiesCount = Math.floor(level / 4);
   regularAbilityCount += extraRegularAbilitiesCount;
   regularAbilityUpgrades += extraRegularAbilitiesCount; // Same quantity as regular ability increase.

   if (level >= 6) {
      // Only one special ability upgrade available currently.
      specialAbilityCount++;
   }
   if (level >= 11) {
      ultimateAbilityCount++;
   }
   if (level >= 16) {
      specialAbilityUpgrades++;
      ultimateAbilityUpgrades++;
   }

   return new AbilityCounts(
       regularAbilityCount, specialAbilityCount, ultimateAbilityCount, 
       regularAbilityUpgrades, specialAbilityUpgrades, ultimateAbilityUpgrades);
}

function calculateAbilityEffectPower(abilityCounts, level) {
   let regularAbilityEffectPower = 13;
   let specialAbilityEffectPower = regularAbilityEffectPower * 2; // 26
   let ultimateAbilityEffectPower = regularAbilityEffectPower * 6; // 78

   let regUpEffectPower = 2;
   let specUpEffectPower = 0;
   let ultUpEffectPower = 0;

   // Adjust effect power values for abilities based on the player level to simulate power leaps.
   if (level >= 10 && level < 15) {
      regularAbilityEffectPower *= 3;
      specialAbilityEffectPower *= 3;
      ultimateAbilityEffectPower *= 3;
      regUpEffectPower = 12; // CEIL(* 0.6)
      specUpEffectPower = 0;
      ultUpEffectPower = 0;
   } else if (level >= 15) {
      regularAbilityEffectPower *= 4;
      specialAbilityEffectPower *= 4;
      ultimateAbilityEffectPower *= 4;
      regUpEffectPower = 63; // CEIL(* 11.2)
      specUpEffectPower = 125;
      ultUpEffectPower = 375;
   }

   return (abilityCounts.r * regularAbilityEffectPower) +
       (abilityCounts.rU * regUpEffectPower) +

       (abilityCounts.s * specialAbilityEffectPower) +
       (abilityCounts.sU * specUpEffectPower) +

       (abilityCounts.u * ultimateAbilityEffectPower) +
       (abilityCounts.uU * ultUpEffectPower);
}

function calculatePlayerLevelEffectPower(level) {
   return calculateAbilityEffectPower(getAbilityCounts(level), level);
}

function renderLevelEntryContainer() {
   const levelEntryContainer = document.createElement("div");
   levelEntryContainer.classList.add("basicContainer");
   
   const levelLabel = document.createElement("span");
   levelLabel.innerText = "Your Level:";
   levelLabel.classList.add("whiteLabel");
   levelEntryContainer.appendChild(levelLabel);
   
   const levelEffectPowerValue = document.createElement("span");
   levelEffectPowerValue.classList.add("whiteLabel");
   const levelInput = document.createElement("input");
   levelInput.type = "text";
   levelInput.id = "levelInput";
   levelInput.name = "levelInput;"
   levelInput.classList.add("smallInput");
   levelInput.maxLength = 3;
   levelInput.addEventListener("input", () => {
      // Adjust Effect Power Label
      levelEffectPowerValue.innerText = calculatePlayerLevelEffectPower(levelInput.value);
      playerLevel = levelInput.value;
      elToFocus = levelInput.id;
      renderFn(); // refresh page
   });
   levelInput.value = playerLevel;
   levelEffectPowerValue.innerText = calculatePlayerLevelEffectPower(levelInput.value);
   levelEntryContainer.appendChild(levelInput);
   
   const levelEffectPowerLabel = document.createElement("span");
   levelEffectPowerLabel.innerText = "Total Effect Power for your level: ";
   levelEffectPowerLabel.classList.add("whiteLabel");
   levelEntryContainer.appendChild(levelEffectPowerLabel);
   
   levelEntryContainer.appendChild(levelEffectPowerValue);
   
   return levelEntryContainer;
}

function renderInputWithLabel(name, id, value, callback) {
   const regUpLabel = document.createElement("div");
   regUpLabel.innerText = name;
   regUpLabel.classList.add("whiteLabel");

   const regUpInput = document.createElement("input");
   regUpInput.type = "text";
   regUpInput.id = id;
   regUpInput.name = id;
   regUpInput.classList.add("smallInput");
   regUpInput.maxLength = 3;
   regUpInput.addEventListener("input", () => {
      callback(regUpInput.value);
      elToFocus = regUpInput.id;
      renderFn();
   });
   regUpInput.value = value;
   regUpLabel.appendChild(regUpInput);
   return regUpLabel;
}

function renderAbilityTypeSelectionContainer() {
   const containerWithHeader = document.createElement("div");
   containerWithHeader.classList.add("basicContainer");
   
   const effectPoolLabel = document.createElement("div");
   effectPoolLabel.classList.add("whiteLabel");
   effectPoolLabel.innerText = "\nAbility's total available Effect Power: ";
   const effectPoolValueLabel = document.createElement("span");
   effectPowerPool = calculateAbilityEffectPower(new AbilityCounts(rCount, sCount, uCount, rUCount, sUCount, uUCount), playerLevel);
   effectPoolValueLabel.innerText = effectPowerPool;
   effectPoolLabel.appendChild(effectPoolValueLabel);
   
   const abilityTypeLabel = document.createElement("div");
   abilityTypeLabel.classList.add("headerLabel");
   abilityTypeLabel.innerText = "Set Ability Type (Increase numbers to create a combined ability)";
   containerWithHeader.appendChild(abilityTypeLabel);
   
   const abilityTypeSelectionContainer = document.createElement("div");
   const leftContainer = document.createElement("div");
   const rightContainer = document.createElement("div");
   abilityTypeSelectionContainer.classList.add("containerFlex");
   abilityTypeSelectionContainer.appendChild(leftContainer);
   abilityTypeSelectionContainer.appendChild(rightContainer);
   containerWithHeader.appendChild(abilityTypeSelectionContainer);

   leftContainer.appendChild(renderInputWithLabel(
       "Regular: ", "regInput", rCount, (value) => {
          rCount = value;
       }));
   leftContainer.appendChild(renderInputWithLabel(
       "Special: ", "specInput", sCount, (value) => {
          sCount = value;
       }));
   leftContainer.appendChild(renderInputWithLabel(
       "Ultimate: ", "ultInput", uCount, (value) => {
          uCount = value;
       }));
   
   // Upgrades
   rightContainer.appendChild(renderInputWithLabel(
       "Regular Upg: ", "regUpInput", rUCount, (value) => {
          rUCount = value;
       }));
   rightContainer.appendChild(renderInputWithLabel(
       "Special Upg: ", "specUpInput", sUCount, (value) => {
          sUCount = value;
       }));
   rightContainer.appendChild(renderInputWithLabel(
       "Ultimate Upg: ", "ultUpInput", uUCount, (value) => {
          uUCount = value;
       }));
   // </Upgrades>
   
   containerWithHeader.appendChild(effectPoolLabel);
   
   return containerWithHeader;
}

function renderEffectTypeSelection(effectList) {
   const select = document.createElement("select");
   select.id = "abilityEffectSelect";
   select.classList.add("smallSelect");

   const defaultOption = document.createElement("option");
   defaultOption.text = "Select Effect";
   defaultOption.value = 0;
   select.appendChild(defaultOption);
   if (selectedEffect == null) defaultOption.setAttribute("selected", true);
   effectList.forEach((effect)=> {
      const effectOption = document.createElement("option");
      effectOption.text = effect.toString();
      effectOption.value = effect.id;
      if (selectedEffect && effect.id == selectedEffect.id) {
         effectOption.setAttribute("selected", true);
      }
      select.appendChild(effectOption);
   });

   select.addEventListener("input", () => {
      selectedEffect = null;
      effectList.forEach((effect) => {
         if (effect.id == select.value) {
            selectedEffect = effect;
         }
      });
      elToFocus = select.id;
      renderFn();
      console.log(selectedEffect);
   });

   return select;
}

function renderAbilityCreatorContainer() {
   const abilityCreationContainer = document.createElement("div");
   abilityCreationContainer.classList.add("basicContainer");
   
   const abilityContainerHeader = document.createElement("div");
   abilityContainerHeader.classList.add("headerLabel");
   abilityContainerHeader.innerText = "Add effects to your custom ability";
   abilityCreationContainer.appendChild(abilityContainerHeader);
   
   const effectSelectionRow = document.createElement("div");
   effectSelectionRow.appendChild(renderEffectTypeSelection(generateEffectTypesList()));
   abilityCreationContainer.appendChild(effectSelectionRow);
   
   if (selectedEffect) {
      if (selectedEffect.effectValueType == EffectValueType.Dice) {
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Dice Quantity: ", "diceInput", diceAmount, (value) => {
                diceAmount = value;
             }));
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Dice Sides: ", "sidesInput", diceSides, (value) => {
                diceSides = value;
             }));
         effectSelectionRow.appendChild(renderInputWithLabel(
             "+Amount: ", "plusAmountInput", diceAdder, (value) => {
                diceAdder = value;
             }));
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Rounds(1=Instant,>1=DoT): ", "roundsInput", effectRounds, (value) => {
                effectRounds = value;
             }));
      } else if (selectedEffect.effectValueType == EffectValueType.Rounds) {
         effectRounds = 1;
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Rounds: ", "roundsInput", effectAmountMultiplier, (value) => {
                effectAmountMultiplier = value;
             }));
      } else {
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Amount: ", "amountInput", effectAmountMultiplier, (value) => {
                effectAmountMultiplier = value;
             }));
         effectSelectionRow.appendChild(renderInputWithLabel(
             "Rounds: ", "roundsInput", effectRounds, (value) => {
                effectRounds = value;
             }));
      }
   }
   
   const tradeoffLabel = document.createElement("div");
   tradeoffLabel.classList.add("headerLabel");
   tradeoffLabel.innerText = "\nPositive or negative effect: ";
   effectSelectionRow.appendChild(tradeoffLabel);

   const tradeOffInput = document.createElement("select");
   tradeOffInput.id = "tradeOffInput";
   tradeOffInput.classList.add("smallSelect");
   const positiveOption = document.createElement("option");
   positiveOption.value = true;
   positiveOption.text = "Positive (Affects me in a good way)";
   if (isPositive) positiveOption.setAttribute("selected", true);
   const negativeOption = document.createElement("option");
   negativeOption.value = false;
   negativeOption.text = "Negative (Affects me in a bad way)";
   if (!isPositive) negativeOption.setAttribute("selected", true);
   tradeOffInput.appendChild(positiveOption);
   tradeOffInput.appendChild(negativeOption);
   tradeOffInput.addEventListener("input", () => {
      isPositive = tradeOffInput.value == "true";
      elToFocus = tradeOffInput.id;
      renderFn();
   });
   tradeoffLabel.appendChild(tradeOffInput);
   
   // Effect power value
   // Add button!
   let effectPowerDelta = 0;
   if (selectedEffect) {
      if (selectedEffect.effectValueType == EffectValueType.Dice) {
         effectPowerDelta =
             ((((Number(diceAmount) * Number(diceSides) / 2) + (Number(diceAmount) / 2)) 
                 + Number(diceAdder)) * 
                 selectedEffect.effectPowerInc);
      } else {
         effectPowerDelta = (selectedEffect.effectPowerInc * effectAmountMultiplier);
      }
      if (selectedEffect.effectPowerMod) effectPowerDelta += selectedEffect.effectPowerMod;
      effectPowerDelta = effectPowerDelta * effectRounds;
      if (!isPositive) effectPowerDelta *= -1;
   }
   const addEffectButton = document.createElement("button");
   addEffectButton.id = "addEffectButton";
   addEffectButton.classList.add("buttonStyle");
   addEffectButton.textContent = `Add Effect ${effectPowerDelta}`;
   abilityCreationContainer.appendChild(addEffectButton);
   addEffectButton.addEventListener("click", () => {
      if (selectedEffect) {
         const effectInstance = new EffectInstance(selectedEffect, effectAmountMultiplier, isPositive, diceAmount, diceSides, diceAdder, effectRounds);
         addedEffects.push(effectInstance);
         elToFocus = addEffectButton.id;
         renderFn();
      }
   });
   
   return abilityCreationContainer;
}

function renderAddedEffectsContainer() {
   const effectsContainer = document.createElement("div");

   const emptyLabel = document.createElement("div");
   emptyLabel.classList.add("headerLabel");
   emptyLabel.innerText = "No effects added, add some effects!"

   if (addedEffects.length == 0) {
      effectsContainer.appendChild(emptyLabel);
      effectsContainer.classList.add("effectsEmptyContainer");
   } else {
      let effectPowerDelta = 0;
      addedEffects.forEach((addedEffect, index) => {
         const effectPill = document.createElement("span");
         effectPill.classList.add("effectPill");
         if (addedEffect.isPositive) {
            effectPill.classList.add("positiveEffect");
         } else {
            effectPill.classList.add("negativeEffect");
         }
         effectPill.innerText = addedEffect.toString();
         effectsContainer.appendChild(effectPill);
         effectPowerDelta += addedEffect.getEffectPower();
         
         const removeEffectButton = document.createElement("span");
         removeEffectButton.classList.add("removeEffectPill");
         removeEffectButton.innerText = "X";
         effectPill.appendChild(removeEffectButton);
         removeEffectButton.addEventListener("click", () => {
            addedEffects.splice(index, 1);
            renderFn();
         });
      });
      let totalPoolMinusDelta = effectPowerPool - effectPowerDelta;
      if (totalPoolMinusDelta < 0) {
         effectsContainer.classList.add("effectsNegativeContainer");
      } else {
         effectsContainer.classList.add("basicContainer");
      }
      effectsContainer.classList.add("flexContainer");
      
      const remainingEffectPowerLabel = document.createElement("div");
      remainingEffectPowerLabel.classList.add("whiteLabel");
      remainingEffectPowerLabel.innerText = `Power used: ${effectPowerDelta} | Power allowed: ${effectPowerPool}`;
      effectsContainer.appendChild(remainingEffectPowerLabel);
   }
   
   return effectsContainer;
}

document.addEventListener("DOMContentLoaded", () => {
   const colorPallete = {};
   colorPallete.background = "#263c41";

   document.body.style = `background-color: ${colorPallete.background}; padding: 0; margin: 0;`;
   
   const mainContainerEl = document.getElementById("mainContainer");
   
   renderFn = () => {
      mainContainerEl.innerText = "";
      mainContainerEl.appendChild(renderLevelEntryContainer());
      mainContainerEl.appendChild(renderAbilityTypeSelectionContainer());
      mainContainerEl.appendChild(renderAbilityCreatorContainer());
      mainContainerEl.appendChild(renderAddedEffectsContainer());
      document.getElementById(elToFocus).focus();
   };
   renderFn();
});