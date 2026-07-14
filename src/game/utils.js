export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createRng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
export function validUsername(value){return /^[A-Za-z0-9_-]{3,16}$/.test(String(value).trim())}
export function normalizeUsername(value){return String(value).trim().slice(0,16)}
export function calculateScore({distance=0,durationMs=0,targetsDestroyed=0,comboBonus=0,nearMisses=0}){return Math.max(0,Math.floor(distance*10+durationMs/100+targetsDestroyed*100+comboBonus+nearMisses*75))}
