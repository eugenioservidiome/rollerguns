import{clamp}from"./utils.js";
export class DifficultyDirector{at(seconds){const p=Math.log1p(Math.max(0,seconds)/20);return{speed:clamp(330+p*125,330,780),minReaction:clamp(1.45-p*.08,1.05,1.45),targetChance:clamp(.18+p*.09,.18,.42),bonusChance:.055,complexity:seconds<12?1:seconds<35?2:3,comboMultiplier:1+Math.min(4,Math.floor(seconds/40))}}}
