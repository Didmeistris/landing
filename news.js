const box = document.getElementById('news-container');
const status = document.getElementById('news-status');
const refresh = document.getElementById('news-refresh');
let data = null;
let currentTab = 'all';
let pending = false;
let language = document.documentElement?.dataset?.lang || 'ru';
let lastStatus = 'loading';
const COPY = {
 ru:{locale:'ru-RU',loading:'Проверяем обновления…',saved:'источник недоступен. Показаны сохранённые публикации.',empty:'публикации пока недоступны.',last:'Последняя успешная проверка:',open:'Открыть официальный источник →',noDate:'Дата не указана источником',read:'Читать →',old:'Данные давно не обновлялись. ',checked:'Проверка источников:',partial:'Есть недоступные источники.',failure:'Не удалось получить обновления.',retained:'Показаны ранее загруженные публикации.',retry:'Попробуйте позже или откройте официальные источники.',unavailable:'Новости временно недоступны.',refresh:'↻ Обновить',all:'Все источники'},
 en:{locale:'en-US',loading:'Checking for updates…',saved:'source unavailable. Showing saved publications.',empty:'publications are currently unavailable.',last:'Last successful check:',open:'Open official source →',noDate:'No date provided by source',read:'Read →',old:'Updates are overdue. ',checked:'Sources checked:',partial:'Some sources are unavailable.',failure:'Could not retrieve updates.',retained:'Showing previously loaded publications.',retry:'Try again later or open the official sources.',unavailable:'News is temporarily unavailable.',refresh:'↻ Refresh',all:'All sources'},
 kg:{locale:'ky-KG',loading:'Жаңыртуулар текшерилүүдө…',saved:'булак жеткиликсиз. Сакталган жарыялар көрсөтүлдү.',empty:'жарыялар азырынча жеткиликсиз.',last:'Акыркы ийгиликтүү текшерүү:',open:'Расмий булакты ачуу →',noDate:'Булакта дата көрсөтүлгөн эмес',read:'Окуу →',old:'Маалымат көптөн бери жаңырган жок. ',checked:'Булактар текшерилди:',partial:'Айрым булактар жеткиликсиз.',failure:'Жаңыртууларды алуу мүмкүн болгон жок.',retained:'Мурда жүктөлгөн жарыялар көрсөтүлдү.',retry:'Кийинчерээк аракет кылыңыз же расмий булактарды ачыңыз.',unavailable:'Жаңылыктар убактылуу жеткиликсиз.',refresh:'↻ Жаңыртуу',all:'Бардык булактар'}
};
const copy = () => COPY[language] || COPY.ru;
function renderStatus(){
 if(!status)return;
 if(lastStatus==='loading')status.textContent=copy().loading;
 else if(lastStatus==='error')status.textContent=copy().failure+' '+(data?copy().retained:copy().retry);
 else{const old=Date.now()-Date.parse(data.checkedAt)>3*60*60*1000;status.textContent=(old?copy().old:'')+copy().checked+' '+date(data.checkedAt)+' (MSK).'+(Object.values(data.sources).some(s=>s.status!=='ok')?' '+copy().partial:'');}
 if(refresh)refresh.textContent=copy().refresh;
 const all=document.getElementById('ntab-all');if(all)all.textContent=copy().all;
}
window.newsLanguageChanged=lang=>{if(!COPY[lang])return;language=lang;render();renderStatus();};
const date = value => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString(copy().locale, { timeZone: 'Europe/Moscow', dateStyle: 'medium', timeStyle: 'short' }) : null;
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}
export function validItem(item, sources) {
  try {
    const link = new URL(item.link);
    const origin = new URL(sources[item.source].url);
    return link.protocol === 'https:' && link.hostname === origin.hostname && typeof item.title === 'string' && item.title.trim().length > 5;
  } catch { return false; }
}
function render() {
  box.replaceChildren();
  if (!data) return;
  const sources = Object.entries(data.sources).filter(([key]) => currentTab === 'all' || key === currentTab);
  for (const [key, source] of sources) {
    const items = data.items.filter(item => item.source === key && validItem(item, data.sources)).slice(0, currentTab === 'all' ? 3 : 6);
    if (source.status !== 'ok' || !items.length) {
      const warning = element('div', 'news-loader', `${source.label}: ${items.length ? copy().saved : copy().empty}${date(source.updatedAt) ? ' '+copy().last+' ' + date(source.updatedAt) + ' (MSK).' : ''} `);
      warning.style.gridColumn = '1 / -1';
      const link = element('a', 'nc-read', copy().open);
      link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      warning.append(link); box.append(warning);
    }
    for (const item of items) {
      const card = element('a', 'news-card');
      card.href = item.link; card.target = '_blank'; card.rel = 'noopener noreferrer';
      const meta = element('div', 'news-card-meta');
      meta.append(element('span', 'news-source-badge ns-' + key, source.label));
      meta.append(element('span', 'nc-date', item.date && Number.isFinite(Date.parse(item.date)) ? new Date(item.date).toLocaleDateString(copy().locale,{timeZone:'Europe/Moscow',day:'numeric',month:'short',year:'numeric'}) : copy().noDate));
      card.append(meta, element('h4', 'nc-title', item.title));
      if (item.desc) card.append(element('p', 'nc-desc', item.desc));
      card.append(element('span', 'nc-read', copy().read)); box.append(card);
    }
  }
}
window.showNewsTab = tab => {
  if (!['all', 'cz', 'teksher'].includes(tab)) return;
  currentTab = tab;
  document.querySelectorAll('.news-tab-btn').forEach(button => {
    const selected = button.id === 'ntab-' + tab;
    button.classList.toggle('active-ntab', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  render();
};
window.loadAllNews = async () => {
  if (pending || !box) return;
  pending = true; refresh.disabled = true; box.setAttribute('aria-busy', 'true');
  lastStatus='loading';renderStatus();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let response;
    try { response = await fetch(new URL('./news.json', document.baseURI), { cache: 'no-store', signal: controller.signal }); }
    finally { clearTimeout(timer); }
    if (!response.ok) throw new Error('News unavailable');
    const next = await response.json();
    if (!Array.isArray(next.items) || !next.sources || !date(next.checkedAt) || !['cz', 'teksher'].every(key => next.sources[key] && validSource(next.sources[key], key))) throw new Error('Invalid news data');
    data = next; render();
    lastStatus='ok';renderStatus();
  } catch {
    lastStatus='error';renderStatus();
    if (!data) { box.replaceChildren(element('div', 'news-loader', copy().unavailable)); }
  } finally { pending = false; refresh.disabled = false; box.setAttribute('aria-busy', 'false'); }
};
function validSource(source, key) {
  try { return new URL(source.url).hostname === (key === 'cz' ? 'crpt.ru' : 'main.teksher.kg') && new URL(source.url).protocol === 'https:'; } catch { return false; }
}
if (box) {
  window.loadAllNews();
  setInterval(() => { if (!document.hidden) window.loadAllNews(); }, 600000);
}
