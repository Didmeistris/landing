import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync(new URL('../news.js', import.meta.url), 'utf8').replace('export function', 'function');
const sandbox = { document: {getElementById: () => null}, window: {}, URL, Date, setTimeout, clearTimeout, AbortController };
vm.createContext(sandbox); vm.runInContext(code, sandbox);
test('only official HTTPS publications are accepted', () => {
 const sources = {teksher: {url:'https://main.teksher.kg/news.html'}};
 for (const link of ['javascript:alert(1)','https://evil.test/','http://main.teksher.kg/news.html','https://main.teksher.kg.evil.test/']) assert.equal(sandbox.validItem({source:'teksher',title:'Real news title',link},sources),false);
 assert.equal(sandbox.validItem({source:'teksher',title:'Real news title',link:'https://main.teksher.kg/news.html#real'},sources),true);
 assert.equal(sandbox.validItem({source:'unknown',title:'Real news',link:'https://main.teksher.kg/'},{}),false);
});
test('refresh replaces data, retains last successful feed on failure, and prevents HTML injection', async () => {
 class Element {
  constructor(){this.children=[];this.attributes={};this.style={};this.classList={toggle(){}};}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  setAttribute(k,v){this.attributes[k]=v;}
 }
 const box=new Element(),status=new Element(),refresh=new Element();
 let requests=0,fail=false;
 const payload={checkedAt:new Date().toISOString(),sources:{cz:{label:'Честный ЗНАК',url:'https://crpt.ru/news/',status:'error'},teksher:{label:'Текшер KG',url:'https://main.teksher.kg/news.html',status:'ok'}},items:[{source:'teksher',title:'<img src=x onerror=alert(1)>',link:'https://main.teksher.kg/news.html#real',date:null}]};
 const app={document:{baseURI:'https://krasmatrix.com/',getElementById:id=>({'news-container':box,'news-status':status,'news-refresh':refresh}[id]),createElement:()=>new Element(),querySelectorAll:()=>[]},window:{},URL,Date,setTimeout,clearTimeout,setInterval:()=>0,AbortController,fetch:async()=>{requests++;if(fail)throw Error('offline');return {ok:true,json:async()=>payload};}};
 vm.createContext(app);vm.runInContext(code,app);
 await new Promise(resolve=>setImmediate(resolve));
 const originalCount=box.children.length;
 assert.equal(originalCount,2);
 assert.equal(box.children[1].children[1].textContent,payload.items[0].title);
 await app.window.loadAllNews();assert.equal(box.children.length,originalCount);
 fail=true;await app.window.loadAllNews();assert.equal(box.children.length,originalCount);
 assert.match(status.textContent,/ранее загруженные/);assert.equal(refresh.disabled,false);assert.equal(requests,3);
 app.window.showNewsTab('cz');assert.equal(box.children.length,1);
});
