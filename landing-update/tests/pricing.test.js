import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../pricing.js',import.meta.url),'utf8').replaceAll('export function','function');
const app={document:{documentElement:{dataset:{}},getElementById:()=>null},window:{},Date,Intl,URL};
vm.createContext(app);vm.runInContext(source,app);
const data={checkedAt:'2026-09-30T12:00:00Z',requestedDate:'2026-09-30',effectiveDate:'2026-09-30',status:'ok',rateMicros:{RUB:1000000,USD:84428300,KGS:965465},plans:[
 {months:1,rubles:23290,amountMinor:{RUB:2329000,USD:27600,KGS:2419900}},
 {months:3,rubles:62990,amountMinor:{RUB:6299000,USD:74700,KGS:6529900}},
 {months:6,rubles:111990,amountMinor:{RUB:11199000,USD:132700,KGS:11599900}},
 {months:12,rubles:194990,amountMinor:{RUB:19499000,USD:231000,KGS:20199900}}]};
test('current pricing validates and has no negative or excessive margin',()=>{
 assert.equal(app.validatePricing(data,data.requestedDate),true);
 for(const plan of data.plans)for(const code of ['USD','KGS']){
  const delta=BigInt(plan.amountMinor[code])*BigInt(data.rateMicros[code])-BigInt(plan.rubles)*100000000n;
  assert.ok(delta>=0n&&delta<=10000000000n);
 }
});
test('rejects stale day, future effective rate, low price and excessive markup',()=>{
 assert.equal(app.validatePricing(data,'2026-10-01'),false);
 const copy=()=>structuredClone(data);
 let next=copy();next.effectiveDate='2099-01-01';assert.equal(app.validatePricing(next,data.requestedDate),false);
 next=copy();next.plans[0].amountMinor.USD=1;assert.equal(app.validatePricing(next,data.requestedDate),false);
 next=copy();next.plans[0].amountMinor.USD+=10000;assert.equal(app.validatePricing(next,data.requestedDate),false);
 next=copy();next.plans[0].rubles-=100;assert.equal(app.validatePricing(next,data.requestedDate),false);
});
test('day rolls over by Moscow timezone',()=>{
 assert.equal(app.moscowDay(new Date('2026-09-30T20:59:59Z')),'2026-09-30');
 assert.equal(app.moscowDay(new Date('2026-09-30T21:00:00Z')),'2026-10-01');
});
