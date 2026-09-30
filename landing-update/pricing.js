const BASE_PLANS = [{months:1,rubles:23290},{months:3,rubles:62990},{months:6,rubles:111990},{months:12,rubles:194990}];
const DEFAULT_CURRENCY = {ru:'RUB',en:'USD',kg:'KGS'};
const COPY = {
 ru:{locale:'ru-RU',month:'/мес',base:'Базовая цена',currency:'Валюта тарифов',loading:'Получаем курс на сегодня…',unavailable:'Курс на сегодня недоступен. Пока показываем тарифы в рублях.',fresh:'Пересчёт по курсу ЦБ на',effective:'действует с',billing:'Стоимость за весь период. Цена за месяц указана для сравнения.',faq:'Маркировка под ключ — от {price}/мес. Состав услуг указан в тарифах. Пополнение кабинета «Честного ЗНАКа» — 0,61 ₽ за код.',fee:'КИЗы включены в тарифы. Пополнение кабинета «Честного ЗНАКа» — 0,61 ₽ за код.',view:'Посмотреть тарифы'},
 en:{locale:'en-US',month:'/month',base:'Base price',currency:'Pricing currency',loading:'Loading today’s exchange rates…',unavailable:'Today’s rate is unavailable. Prices are shown in RUB for now.',fresh:'Converted at the CBR rate for',effective:'effective since',billing:'Total for the full period. Monthly equivalents are shown for comparison.',faq:'Turnkey labeling starts at {price}/month. See the plans for included services. Honest ZNAK account top-up: RUB 0.61 per code.',fee:'Labeling codes are included in the plans. Honest ZNAK account top-up: RUB 0.61 per code.',view:'View plans'},
 kg:{locale:'ky-KG',month:'/ай',base:'Негизги баа',currency:'Тарифтердин валютасы',loading:'Бүгүнкү курс жүктөлүүдө…',unavailable:'Бүгүнкү курс жеткиликсиз. Азырынча тарифтер рубль менен көрсөтүлөт.',fresh:'РФ Борбордук банкынын курсу боюнча',effective:'курс күчүнө кирген күн',billing:'Баасы толук мөөнөт үчүн. Айлык баа салыштыруу үчүн көрсөтүлгөн.',faq:'Толук маркировка айына {price} башталат. Кызматтар тарифтерде көрсөтүлгөн. «Честный ЗНАК» кабинетин толуктоо — ар бир код үчүн 0,61 ₽.',fee:'Маркировка коддору тарифтерге кирет. «Честный ЗНАК» кабинетин толуктоо — ар бир код үчүн 0,61 ₽.',view:'Тарифтерди көрүү'}
};
let language = ['ru','en','kg'].includes(document.documentElement.dataset.lang) ? document.documentElement.dataset.lang : 'ru';
let selectedCurrency = DEFAULT_CURRENCY[language];
let pricingData = null;
let pending = false;
let loading = true;
export function moscowDay(now = new Date()) {
 const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part = type => parts.find(p=>p.type===type).value;
 return part('year')+'-'+part('month')+'-'+part('day');
}
export function validatePricing(data, today = moscowDay()) {
 if (!data || data.status !== 'ok' || data.requestedDate !== today || !Number.isFinite(Date.parse(data.checkedAt)) || moscowDay(new Date(data.checkedAt)) !== today) return false;
 if (!Number.isFinite(Date.parse(data.effectiveDate)) || !/^\d{4}-\d{2}-\d{2}$/.test(data.effectiveDate) || data.effectiveDate > today || (Date.parse(today)-Date.parse(data.effectiveDate)) > 10*86400000) return false;
 if (!data.rateMicros || !Array.isArray(data.plans) || data.plans.length !== BASE_PLANS.length) return false;
 try {
  for (const base of BASE_PLANS) {
   const plan = data.plans.find(p=>p.months===base.months);
   if (!plan || plan.rubles!==base.rubles || plan.amountMinor?.RUB!==base.rubles*100) return false;
   for (const code of ['USD','KGS']) {
    const rate=data.rateMicros[code],minor=plan.amountMinor[code];
    if (!Number.isSafeInteger(rate) || rate<=0 || !Number.isSafeInteger(minor) || minor<=0) return false;
    const converted=BigInt(minor)*BigInt(rate);
    const minimum=BigInt(base.rubles)*100000000n;
    if (converted < minimum || converted > minimum + 10000000000n) return false;
   }
  }
  return true;
 } catch { return false; }
}
function formatMinor(minor, currency, lang = language) {
 const number = new Intl.NumberFormat(COPY[lang].locale,{minimumFractionDigits:minor%100?2:0,maximumFractionDigits:2}).format(minor/100);
 if (currency==='USD') return '$'+number;
 return number + '\u00a0' + (currency==='KGS' ? 'сом' : '₽');
}
function currentCurrency() {
 return selectedCurrency==='RUB' || validatePricing(pricingData) ? selectedCurrency : 'RUB';
}
function activePlans() {
 return currentCurrency()==='RUB' ? BASE_PLANS.map(p=>({...p,amountMinor:{RUB:p.rubles*100}})) : pricingData.plans;
}
function firstPrice() {
 const currency=currentCurrency();return formatMinor(activePlans()[0].amountMinor[currency],currency);
}
function renderPricing() {
 const section=document.getElementById('pricing');if(!section)return;
 const currency=currentCurrency(),copy=COPY[language];
 const plans=activePlans();
 for(const plan of plans){
  const card=section.querySelector(`[data-plan-months="${plan.months}"]`);if(!card)continue;
  const minor=plan.amountMinor[currency];
  card.querySelector('.p-price').textContent=formatMinor(minor,currency);
  const monthly=card.querySelector('.p-sub');
  monthly.textContent=plan.months===1 ? '\u00a0' : '≈ '+formatMinor(Math.ceil(minor/plan.months),currency)+copy.month;
  const base=card.querySelector('.p-rub-base');
  base.textContent=currency==='RUB'?'':copy.base+': '+formatMinor(plan.rubles*100,'RUB');base.hidden=currency==='RUB';
 }
 const controls=document.getElementById('pricing-currencies');controls?.setAttribute('aria-label',copy.currency);
 controls?.querySelectorAll('[data-currency]').forEach(button=>{
  const active=button.dataset.currency===currency;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
 });
 const note=document.getElementById('pricing-status');
 if(note){
  if(loading && !pricingData)note.textContent=copy.loading;
  else if(validatePricing(pricingData)){
   const format=value=>new Intl.DateTimeFormat(copy.locale,{timeZone:'Europe/Moscow',dateStyle:'medium'}).format(new Date(value+'T12:00:00Z'));
   note.textContent=copy.fresh+' '+format(pricingData.requestedDate)+(pricingData.effectiveDate!==pricingData.requestedDate?' · '+copy.effective+' '+format(pricingData.effectiveDate):'')+' · '+copy.billing;
  }else note.textContent=copy.unavailable+' '+copy.billing;
 }
 const faq=document.querySelector('[data-i18n="faq-a1"]');if(faq)faq.textContent=copy.faq.replace('{price}',firstPrice());
 const description=document.querySelector('[data-i18n="pr-desc"]');if(description)description.textContent=copy.fee;
}
window.getPricingAnswer = () => COPY[language].faq.replace('{price}',firstPrice());
window.pricingLanguageChanged = lang => {
 if(!COPY[lang])return;language=lang;selectedCurrency=DEFAULT_CURRENCY[lang];renderPricing();
};
async function loadPricing(){
 if(pending)return;pending=true;
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  let response;
  try{response=await fetch(new URL('./pricing.json',document.baseURI),{cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok)throw Error('Pricing unavailable');
  const next=await response.json();
  if(validatePricing(next))pricingData=next;
  else if(!validatePricing(pricingData))pricingData=null;
 }catch{if(!validatePricing(pricingData))pricingData=null;}
 finally{pending=false;loading=false;renderPricing();}
}
const controls=document.getElementById('pricing-currencies');
if(controls){
 controls.querySelectorAll('[data-currency]').forEach(button=>button.addEventListener('click',()=>{selectedCurrency=button.dataset.currency;renderPricing();}));
 renderPricing();loadPricing();
 setInterval(()=>{renderPricing();if(!document.hidden)loadPricing();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderPricing();loadPricing();}});
}
