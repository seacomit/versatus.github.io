let renderFn = null;
let playerLevel = 1;
let effectPowerPool = 0;
let selectedEffect = null;
let rCount = 1;
let sCount = 0;
let uCount = 0;
let rUCount = 1;
let sUCount = 0;
let uUCount = 0;

let effectAmountMultiplier = 1;
let isPositive = true;
let elToFocus = "levelInput";

let addedEffects = [];

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
   constructor(effect, multiplier, isPositive) {
      this.effect = effect;
      this.multiplier = multiplier;
      this.isPositive = isPositive;
   }
   
   getEffectPower() {
      let value = (this.effect.effectPowerInc * this.multiplier)
      if (this.effect.effectPowerMod) {
         value += this.effect.effectPowerMod;
      }
      if (!this.isPositive) value *= -1;
      return value;
   }
}

// Defines an effect type, like inflict damage, heal, stun, slow, fly etc. 
class EffectType {
   constructor(name, valueInc, effectPowerInc, roundBased, effectPowerMod, id=0) {
      this.name = name;
      this.valueInc = valueInc;
      this.effectPowerInc = effectPowerInc;
      this.roundBased = roundBased;
      this.effectPowerMod = effectPowerMod;
      this.id = id;
   }
   
   toString() {
      let nameStr = this.name;
      if (this.roundBased) {
         nameStr += ` -- (${this.valueInc} round${this.valueInc > 1 ? 's' : ''})`;
      }
      return nameStr;
   }
}

function generateEffectTypesList() {
   const effectTypes = [];
   
   // Damage and Heal Effects
   effectTypes.push(new EffectType("Damage", 1, 1));
   effectTypes.push(new EffectType("Heal", 1, 1));
   
   // Hit and Armor Effects
   effectTypes.push(new EffectType("+Hit", 1, 4.5, false, -0.5));
   effectTypes.push(new EffectType("+AC", 1, 4.5, false, -0.5));
   
   // Miscellaneous Effects 
   effectTypes.push(new EffectType("Invisibility", 1, 9, true));
   effectTypes.push(new EffectType("Flight", 1, 13, true));
   effectTypes.push(new EffectType("Stun(Unbreakable)", 1, 13, true));
   effectTypes.push(new EffectType("Stun(Breakable)", 1, 7, true));
   effectTypes.push(new EffectType("Control", 1, 26, true));
   effectTypes.push(new EffectType("Confuse", 1, 14, true));
   effectTypes.push(new EffectType("Move twice", 1, 13, true));
   effectTypes.push(new EffectType("Move 1 squares", 1, 4, true));
   effectTypes.push(new EffectType("Pull (n feet)", 1, 13, true));
   effectTypes.push(new EffectType("Knockback", 1, 7, true));
   effectTypes.push(new EffectType("Slow (-1ac, -1hit, -1sqr)", 1, 9, true));
   effectTypes.push(new EffectType("Invulnerability", 1, 26, true));
   effectTypes.push(new EffectType("Reflect", 1, 13, true));
   
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

function renderAbilityTypeSelectionContainer() {
   const containerWithHeader = document.createElement("div");
   containerWithHeader.classList.add("basicContainer");
   
   const effectPoolLabel = document.createElement("div");
   effectPoolLabel.classList.add("whiteLabel");
   effectPoolLabel.innerText = "Available Effect Power: ";
   const effectPoolValueLabel = document.createElement("span");
   effectPowerPool = calculateAbilityEffectPower(new AbilityCounts(rCount, sCount, uCount, rUCount, sUCount, uUCount), playerLevel);
   effectPoolValueLabel.innerText = effectPowerPool;
   effectPoolLabel.appendChild(effectPoolValueLabel);
   
   const abilityTypeLabel = document.createElement("div");
   abilityTypeLabel.classList.add("headerLabel");
   abilityTypeLabel.innerText = "Select ability pool (How many abilities do you want this one equal to)";
   containerWithHeader.appendChild(abilityTypeLabel);
   
   const abilityTypeSelectionContainer = document.createElement("div");
   abilityTypeSelectionContainer.classList.add("containerFlex");
   containerWithHeader.appendChild(abilityTypeSelectionContainer);

   const regLabel = document.createElement("div");
   regLabel.innerText = "Regular: ";
   regLabel.classList.add("whiteLabel");
   abilityTypeSelectionContainer.appendChild(regLabel);

   const regInput = document.createElement("input");
   regInput.type = "text";
   regInput.id = "regInput";
   regInput.name = "regInput;"
   regInput.classList.add("smallInput");
   regInput.maxLength = 3;
   regInput.addEventListener("input", () => {
      rCount = regInput.value;
      elToFocus = regInput.id;
      renderFn();
   });
   regInput.value = rCount;
   regLabel.appendChild(regInput);

   const specLabel = document.createElement("div");
   specLabel.innerText = "Special: ";
   specLabel.classList.add("whiteLabel");
   abilityTypeSelectionContainer.appendChild(specLabel);

   const specInput = document.createElement("input");
   specInput.type = "text";
   specInput.id = "specInput";
   specInput.name = "specInput;"
   specInput.classList.add("smallInput");
   specInput.maxLength = 3;
   specInput.addEventListener("input", () => {
      sCount = specInput.value;
      elToFocus = specInput.id;
      renderFn();
   });
   specInput.value = sCount;
   specLabel.appendChild(specInput);
   
   
   const ultLabel = document.createElement("div");
   ultLabel.innerText = "Ultimate: ";
   ultLabel.classList.add("whiteLabel");
   abilityTypeSelectionContainer.appendChild(ultLabel);

   const ultInput = document.createElement("input");
   ultInput.type = "text";
   ultInput.id = "ultInput";
   ultInput.name = "ultInput;"
   ultInput.classList.add("smallInput");
   ultInput.maxLength = 3;
   ultInput.addEventListener("input", () => {
      uCount = ultInput.value;
      elToFocus = ultInput.id;
      renderFn();
   });
   ultInput.value = uCount;
   ultLabel.appendChild(ultInput);
   
   containerWithHeader.appendChild(effectPoolLabel);
   
   /*
   const abilityTypeInput = document.createElement("select");
   abilityTypeInput.classList.add("smallSelect");
   const regOption = document.createElement("option");
   regOption.value = "regular";
   regOption.text = "Regular (1d6 cooldown)";
   const specOption = document.createElement("option");
   specOption.value = "special";
   specOption.text = "Special (1d8 cooldown)";
   const ultOption = document.createElement("option");
   ultOption.value = "ultimate";
   ultOption.text = "Ultimate (Once a day)";
   abilityTypeInput.appendChild(regOption);
   abilityTypeInput.appendChild(specOption);
   abilityTypeInput.appendChild(ultOption);
   abilityTypeSelectionContainer.appendChild(abilityTypeInput);*/

   
   
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
   
   const multiplierLabel = document.createElement("div");
   multiplierLabel.classList.add("headerLabel");
   multiplierLabel.innerText = "Effect amount (Value or Rounds): ";
   effectSelectionRow.appendChild(multiplierLabel);
   
   const multiplierInput = document.createElement("input");
   multiplierInput.type = "text";
   multiplierInput.id = "multiplierInput";
   multiplierInput.name = "multiplierInput;"
   multiplierInput.classList.add("smallInput");
   multiplierInput.maxLength = 3;
   multiplierInput.addEventListener("input", () => {
      effectAmountMultiplier = multiplierInput.value;
      elToFocus = multiplierInput.id;
      renderFn();
   });
   multiplierInput.value = effectAmountMultiplier;
   multiplierLabel.appendChild(multiplierInput);

   const tradeoffLabel = document.createElement("div");
   tradeoffLabel.classList.add("headerLabel");
   tradeoffLabel.innerText = "Positive or negative effect: ";
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
      effectPowerDelta = (selectedEffect.effectPowerInc * effectAmountMultiplier);
      if (selectedEffect.effectPowerMod) effectPowerDelta += selectedEffect.effectPowerMod;
      if (!isPositive) effectPowerDelta *= -1;
   }
   const addEffectButton = document.createElement("button");
   addEffectButton.id = "addEffectButton";
   addEffectButton.classList.add("buttonStyle");
   addEffectButton.textContent = `Add Effect ${effectPowerDelta}`;
   abilityCreationContainer.appendChild(addEffectButton);
   addEffectButton.addEventListener("click", () => {
      if (selectedEffect) {
         const effectInstance = new EffectInstance(selectedEffect, effectAmountMultiplier, isPositive);
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
         effectPill.innerText = addedEffect.getEffectPower() + " " + addedEffect.effect.toString();
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