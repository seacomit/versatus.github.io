
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
   effectTypes.push(new EffectType("Damage", 0.5, 0.5));
   effectTypes.push(new EffectType("Heal", 0.5, 0.5));
   
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

function createEffectTypeSelection(effectList) {
   const select = document.createElement("select");
   
   const defaultOption = document.createElement("option");
   defaultOption.text = "Select Effect";
   defaultOption.value = 0;
   select.appendChild(defaultOption);
   
   effectList.forEach((effect)=> {
      const effectOption = document.createElement("option");
      effectOption.text = effect.toString();
      effectOption.value = effect.id;
      select.appendChild(effectOption);
   });

   return select;
}

function calculatePlayerLevelEffectPower(level) {
   
   const regularAbilityEffectPower = 13;
   const specialAbilityEffectPower = regularAbilityEffectPower * 2; // 26
   const ultimateAbilityEffectPower = regularAbilityEffectPower * 6; // 78
   
   // We start with two regular abilities.
   let baseEffectPower = regularAbilityEffectPower * 2;
   
   // then for every 4 levels we get 1 extra regular ability and 1 upgrade.
   // so +13 and + 2 for level range between 1 and 9.
   
   if (level < 10) {
      
   } else if (level >= 10 && level < 15) {
      
   } else {
      
   }
   
   return 80;
}


function createLevelEntryContainer() {
   const levelEntryContainer = document.createElement("div");
   levelEntryContainer.classList.add("basicContainer");
   
   const levelLabel = document.createElement("span");
   levelLabel.innerText = "Your Level:";
   levelLabel.classList.add("whiteLabel");
   levelEntryContainer.appendChild(levelLabel);
   
   const levelEffectPowerValue = document.createElement("span");
   const levelInput = document.createElement("input");
   levelInput.type = "text";
   levelInput.id = "levelInput";
   levelInput.name = "levelInput;"
   levelInput.classList.add("smallInput");
   levelInput.maxLength = 3;
   levelInput.addEventListener("input", () => {
      // Adjust Effect Power Label
      levelEffectPowerValue.innerText = calculatePlayerLevelEffectPower(levelInput.value);
   });
   levelEntryContainer.appendChild(levelInput);
   
   const levelEffectPowerLabel = document.createElement("span");
   levelEffectPowerLabel.innerText = "Total Effect Power for your level: ";
   levelEffectPowerLabel.classList.add("whiteLabel");
   levelEntryContainer.appendChild(levelEffectPowerLabel);
   
   levelEntryContainer.appendChild(levelEffectPowerValue);
   
   
   return levelEntryContainer;
}

document.addEventListener("DOMContentLoaded", () => {
   const colorPallete = {};
   colorPallete.background = "#263c41";


   document.body.style = `background-color: ${colorPallete.background}; padding: 0; margin: 0;`;
   
   const mainContainerEl = document.getElementById("mainContainer");

   
   mainContainerEl.appendChild(createLevelEntryContainer());
   mainContainerEl.appendChild(createEffectTypeSelection(generateEffectTypesList()));
});