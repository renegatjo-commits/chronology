/* SAFE SPACE · Хронология персонажа · тема #1364 · GitHub Pages v4.
   Автосбор работает на https://safespace.rusff.me/ с правами вошедшего пользователя.
   На GitHub Pages доступны ручное редактирование, JSON и HTML-экспорт.
   Не отправляет и не изменяет сообщения, темы или профили форума. */
(function () {
  'use strict';
  const HOST = 'safespace.rusff.me';
  const ROOTS = {5:'plot',8:'personal',9:'alternative'};
  const SECTIONS = [5,8,9,17,18,19,22];
  const CAT = {personal:'Личные эпизоды',plot:'Сюжетные эпизоды',alternative:'Альтернативные эпизоды'};
  const STATUS = {ongoing:'В процессе',finished:'Закрыт',abandoned:'Заброшен'};
  const MAX_SEARCH_PAGES = 250;
  const MAX_EPISODES = 1500;
  const STORAGE_KEY = 'safe-space-chronology-v2-';
  const LEGACY_KEY = 'safe-space-chronology-v1-';
  const VIEW = {timeline:'Хронология',alternative:'Альтернатива',unfinished:'Незавершённые'};
  const isUnfinished = s=>/незаверш|недоигр|заброш|брошенн|заморож|незакрыт/i.test(normalize(s).toLowerCase().replace(/ё/g,'е'));
  const SEP = '\u00a0';
  const MONTHS = {января:1,январь:1,янв:1,февраля:2,февраль:2,фев:2,марта:3,март:3,мар:3,апреля:4,апрель:4,апр:4,мая:5,май:5,июня:6,июнь:6,июля:7,июль:7,августа:8,август:8,сентября:9,сентябрь:9,сент:9,октября:10,октябрь:10,окт:10,ноября:11,ноябрь:11,ноя:11,декабря:12,декабрь:12,дек:12};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => String(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const forumUrl = path => 'https://' + HOST + path;
  const topicURL = id => forumUrl('/viewtopic.php?id='+encodeURIComponent(id));
  const select = (doc, selector) => [...doc.querySelectorAll(selector)];
  const getText = (el) => el ? normalize(el.textContent||'') : '';
  const pause = ms => new Promise(ok=>setTimeout(ok,ms));
  function isForum() {return location.hostname === HOST || location.hostname.endsWith('.'+HOST);}
  const forumMode = isForum();
  const isTargetTopic = forumMode && /\/viewtopic\.php$/i.test(location.pathname)
    && new URLSearchParams(location.search).get('id') === '1364';
  // No floating buttons or forum-wide widgets: the constructor lives only in topic #1364.
  if (forumMode && !isTargetTopic) return;
  if (document.getElementById('ssc-overlay')) return;
  function safeURL(raw) {
    try {const u = new URL(raw, forumUrl('/')); return u.hostname===HOST && u.protocol==='https:' ? u.href : '';} catch(e) {return '';}
  }
  function topicId(link) {
    try {const u=new URL(link,forumUrl('/')); if (!u.pathname.endsWith('/viewtopic.php'))return null;return /^\d+$/.test(u.searchParams.get('id')||'')?u.searchParams.get('id'):null;}catch(e){return null;}
  }
  function forumId(link) {
    try {const u=new URL(link,forumUrl('/'));return u.pathname.endsWith('/viewforum.php')?Number(u.searchParams.get('id'))||null:null;}catch(e){return null;}
  }
  function dateInfo(value) {
    let s=normalize(value).toLowerCase().replace(/ё/g,'е');
    if(!s) return {key:'9999-99-99', display:'Дата не указана', precision:'none'};
    const out=(y,m,d,precision)=>({key:String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),display:normalize(value),precision});
    let m=s.match(/\b((?:18|19|20)\d{2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})\b/);
    if(m&&+m[2]<=12&&+m[3]<=31)return out(+m[1],+m[2],+m[3],'day');
    m=s.match(/\b(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*((?:18|19|20)\d{2})\b/);
    if(m&&+m[2]<=12&&+m[1]<=31)return out(+m[3],+m[2],+m[1],'day');
    m=s.match(/\b(\d{1,2})(?:\s*[-–—]\s*\d{1,2})?\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s+((?:18|19|20)\d{2})\b/);
    if(m&&+m[1]<=31)return out(+m[3],MONTHS[m[2]],+m[1],'day');
    m=s.match(/\b(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря|январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s+((?:18|19|20)\d{2})\b/);
    if(m) return out(+m[2],MONTHS[m[1]],15,'month');
    m=s.match(/\b(весна|весной|лето|летом|осень|осенью|зима|зимой)\s+((?:18|19|20)\d{2})\b/);
    if(m) return out(+m[2],({весна:4,весной:4,лето:7,летом:7,осень:10,осенью:10,зима:1,зимой:1})[m[1]],15,'season');
    m=s.match(/\b((?:18|19|20)\d{2})\b/);
    if(m)return out(+m[1],7,1,'year');
    return {key:'9999-99-99',display:normalize(value),precision:'unknown'};
  }
  function extractDate(text,title) {
    const lines=String(text||'').split(/\n/).map(normalize).filter(Boolean);
    const tagged=lines.filter(s=>/(?:^|\b)(?:дата|время|когда|действие|период|date|time)\s*[:—–-]/i.test(s));
    const candidates=[...tagged.slice(0,8), title, ...lines.slice(0,18)];
    for(const c of candidates){
      // The year of the actual game must come from the episode body, not the post timestamp.
      const i=dateInfo(c);if(i.precision!=='none'&&i.precision!=='unknown'){
        const d=c.replace(/^.*?(?:дата|время|когда|период|date|time)\s*[:—–-]\s*/i,'').slice(0,110);
        return {date:normalize(d),dateKey:i.key};
      }
    }
    return {date:'',dateKey:'9999-99-99'};
  }
  function categoryFor(text) {
    const s=normalize(text).toLowerCase().replace(/ё/g,'е');
    if(/альтернат|alternative|аушк|\bau\b/i.test(s))return 'alternative';
    if(/сюжет|квест|plot/i.test(s))return 'plot';
    if(/личн|personal/i.test(s))return 'personal';
    return '';
  }
  function statusFor(text) {
    const s=normalize(text).toLowerCase().replace(/ё/g,'е');
    if(/заброш|недоигр|заморож|abandon/.test(s))return 'abandoned';
    if(/заверш|закрыт|окончен|отыгран|finished|complete/.test(s))return 'finished';
    if(/в процессе|идет игра|открыт|активн|in progress/.test(s))return 'ongoing';
    return '';
  }
  function getCrumbs(doc) {
    const nodes=select(doc,'#pun-crumbs1 a[href*="viewforum.php"], #pun-crumbs2 a[href*="viewforum.php"], .crumbs a[href*="viewforum.php"]');
    const unique=new Map();nodes.forEach(a=>{const id=forumId(a.href);if(id)unique.set(id,getText(a));});
    return [...unique].map(([id,label])=>({id,label}));
  }
  function parseAuthors(doc) {
    const authors=new Map();
    select(doc,'#pun-viewtopic .post, #pun-main .post').forEach(post=>{
      const links=select(post,'.pa-author a[href*="profile.php"], .post-author a[href*="profile.php"], .pa-author a, .post-author a');
      const name=links.map(getText).find(Boolean)||getText(post.querySelector('.pa-author, .post-author'));
      if(name){const tidy=normalize(name.replace(/^Автор:\s*/i,''));if(tidy) authors.set(tidy.toLowerCase(),tidy);}
    });
    return [...authors.values()];
  }
  function extractParticipants(firstText,title,authors) {
    const lines=String(firstText||'').split(/\n/).map(normalize).filter(Boolean);
    const tagged=lines.find(s=>/^(?:участники|действующие лица|игроки|персонажи|с кем|кто|participants|characters)\s*[:—–-]/i.test(s));
    let p=tagged?tagged.replace(/^(?:участники|действующие лица|игроки|персонажи|с кем|кто|participants|characters)\s*[:—–-]\s*/i,''):'';
    if(!p){const t=String(title).replace(/\[[^\]]+\]/g,' ');if(/\s(?:&|×|\bx\b)\s/i.test(t))p=t;}
    if(!p){return {participants:authors.join(', '),source:'Авторы сообщений (не все участники могут быть видны)'};}
    p=normalize(p).slice(0,350);
    return {participants:p,source:'Шапка эпизода / заголовок'};
  }
  function findPostContent(doc) {
    const first=doc.querySelector('#pun-viewtopic .post, #pun-main .post');
    if(!first)return '';
    const contents=first.querySelector('.post-content,.post-body,.post-inner .entry-content');
    if(!contents)return first.textContent||'';
    const c=contents.cloneNode(true);
    select(c,'br').forEach(n=>n.replaceWith(document.createTextNode('\n')));
    select(c,'p,div,li,tr,blockquote,h1,h2,h3').forEach(n=>n.appendChild(document.createTextNode('\n')));
    return c.textContent||'';
  }
  function topicTitle(doc,fallback) {
    const x=doc.querySelector('#pun-viewtopic h1,#pun-main .main h1,#pun-main h1,.topic-title');
    const title=getText(x);
    return title && title.toLowerCase()!=='информация' ? title : fallback||'Без названия';
  }
  function maxPage(doc){
    const nums=select(doc,'#pun-viewtopic .paging a, #pun-viewtopic .pagelink a, .paging a, a[href*="viewtopic.php"][href*="p="]').map(a=>{
      try{const u=new URL(a.href,forumUrl('/'));return u.pathname.endsWith('/viewtopic.php')?Number(u.searchParams.get('p'))||0:0;}catch(e){return 0;}
    });return Math.max(1,...nums);
  }
  function parseEpisode(doc,id,sectionInfo,fromSearch) {
    const crumbs=getCrumbs(doc);
    const label=crumbs.map(x=>x.label).join(' · ');
    const roots=crumbs.filter(x=>ROOTS[x.id]);
    const section=crumbs.filter(x=>SECTIONS.includes(x.id)).at(-1) || sectionInfo || {id:0,label:'Неизвестный раздел'};
    const firstText=findPostContent(doc);
    const title=topicTitle(doc,fromSearch?.title);
    let category=roots.length?ROOTS[roots[0].id]:ROOTS[section.id]||categoryFor(label+' '+section.label);
    if(!category)category=fromSearch?.category || 'personal';
    const explicit = String(title).match(/\[(?:завершено|завершен|закрыто|закрыт|заброшено|заброшен|в процессе)\]/i);
    const metaStatus = (String(firstText).split(/\n/).slice(0,16).map(normalize).find(l=>/^(?:статус|status)\s*[:—–-]/i.test(l))||'');
    const inferred = statusFor(metaStatus) || statusFor(explicit?.[0]||'') || statusFor(label+' '+section.label);
    const status=inferred||'ongoing';
    const view=sectionInfo?.view || (isUnfinished(label+' '+section.label)?'unfinished':category==='alternative'?'alternative':'timeline');
    const date=extractDate(firstText,title);
    const authors=parseAuthors(doc);
    const participant=extractParticipants(firstText,title,authors);
    return {
      id:String(id),title,url:topicURL(id),category,view,status,date:date.date,dateKey:date.dateKey,
      participants:participant.participants,participantsSource:participant.source,
      sectionId:section.id,sectionName:section.label, statusUncertain:!inferred,viewUncertain:!(sectionInfo?.view||isUnfinished(label+' '+section.label)||category==='alternative'||ROOTS[section.id]),
      dateUncertain:!date.date,categoryUncertain:(!roots.length&&!ROOTS[section.id]&&!categoryFor(label+' '+section.label)),
      pages:maxPage(doc), authors,override:{}, notes:'', updatedAt:Date.now()
    };
  }
  // Same-origin requests, including cookie authentication. rusff may serve windows-1251.
  let controller=null;
  async function getPage(path) {
    if(!isForum())throw new Error('Для сбора откройте конструктор на safespace.rusff.me (нужны куки форума).');
    if(controller?.signal.aborted)throw new DOMException('Остановлено пользователем','AbortError');
    const url=new URL(path,forumUrl('/'));
    if(url.hostname!==HOST)throw new Error('Запрос на внешний сайт заблокирован');
    const response=await fetch(url.href,{credentials:'same-origin',cache:'no-store',signal:controller?.signal});
    if(!response.ok)throw new Error('HTTP '+response.status+' — '+url.pathname);
    const bytes=await response.arrayBuffer();
    let encoding=(response.headers.get('content-type')||'').match(/charset\s*=\s*([^; ]+)/i)?.[1]||'';
    if(!encoding){let sample=new TextDecoder('iso-8859-1').decode(bytes.slice(0,1800)); encoding=sample.match(/charset\s*=\s*["']?([^\s"'>]+)/i)?.[1]||'utf-8';}
    let html;try{html=new TextDecoder(encoding.replace(/["']/g,'')).decode(bytes);}catch(e){html=new TextDecoder('utf-8').decode(bytes);}
    const doc=new DOMParser().parseFromString(html,'text/html');
    const access=normalize(doc.querySelector('#pun-message, .message')?.textContent||'');
    if(/не имеете прав для доступа|необходимо войти|доступ запрещен/i.test(access))throw new Error('Форум не даёт доступ к '+url.pathname+'. Войдите под аккаунтом с доступом к разделу.');
    return {doc, finalUrl:response.url};
  }
  function searchLinks(doc, userId) {
    const main=doc.querySelector('#pun-main')||doc;
    const selectors=[
      '#pun-searchposts .post h3 a[href*="viewtopic.php"]',
      '#pun-searchtopics .tclcon h3 a[href*="viewtopic.php"]',
      '.tclcon h3 a[href*="viewtopic.php"]',
      '.post h3 a[href*="viewtopic.php"]',
      'a.topictitle[href*="viewtopic.php"]',
      'div.blocktable tr td.tcl a[href*="viewtopic.php"]',
      '.postlink a[href*="viewtopic.php"]'
    ];
    let all=selectors.flatMap(q=>select(main,q));
    if(!all.length){all=select(main,'a[href*="viewtopic.php"]');}
    const topics=new Map(),pids=new Set();
    for(const a of all){
      if(a.closest('#pun-crumbs1,#pun-crumbs2,.crumbs,.paging,.pagelink,.pagepost'))continue;
      let u;try{u=new URL(a.href,forumUrl('/'));}catch(e){continue;}
      if(!u.pathname.endsWith('/viewtopic.php')||u.hostname!==HOST)continue;
      const id=topicId(u.href);
      const title=getText(a).replace(/^#\d+\s*/,'');
      if(id){const prev=topics.get(id);if(!prev||title.length>prev.title.length)topics.set(id,{id,title});}
      else if(/^\d+$/.test(u.searchParams.get('pid')||''))pids.add(u.href);
    }
    const pages=new Set();
    select(main,'.paging a[href],.pagelink a[href],a[rel="next"][href],.pagelink,.paging').forEach(a=>{
      const href=a.getAttribute('href');if(!href)return;
      try{
        const u=new URL(href,forumUrl('/'));
        if(!u.pathname.endsWith('/search.php')||u.hostname!==HOST)return;
        const aid=u.searchParams.get('user_id');
        if(aid&&aid!==String(userId))return;
        if(u.searchParams.get('action') && !/^show_user_posts$/.test(u.searchParams.get('action')))return;
        pages.add(u.href);
      }catch(e){}
    });
    return {topics,pids:[...pids],pages:[...pages]};
  }
  let states={id:'',items:[],status:'Готово к сбору',scanning:false,errors:[],name:'',log:'',showExport:false,filter:'',profile:null};
  const css=`
  #ssc-launch,#ssc-overlay{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
  #ssc-launch{position:fixed;z-index:2147483640;right:20px;bottom:22px;background:#392a46;border:1px solid #be9d81;color:#fff3e6;border-radius:13px;padding:12px 17px;box-shadow:0 10px 38px #0009;font:600 13px Georgia,serif;cursor:pointer}
  #ssc-overlay{position:fixed;z-index:2147483645;inset:0;background:#09060ddd;display:none;align-items:center;justify-content:center;padding:12px;color:#f2e7f3}
  #ssc-overlay.is-open{display:flex}
  #ssc-overlay *{box-sizing:border-box}
  #ssc-overlay .ssc-shell{width:min(1090px,100%);height:min(97vh,1050px);background:#1c1725;border:1px solid #655369;border-radius:18px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 95px #0009;position:relative}
  #ssc-overlay .ssc-head{flex:none;padding:18px 24px 15px;background:radial-gradient(ellipse at 24% -25%,#60476c 0,transparent 60%),#281e34;border-bottom:1px solid #56425b}
  #ssc-overlay .ssc-heading{display:flex;justify-content:space-between;gap:12px;align-items:start}
  #ssc-overlay h2{margin:0 0 7px!important;color:#fbecf8!important;font:normal clamp(26px,3vw,39px)/1.1 Georgia,serif!important;text-align:left!important;text-transform:none!important}
  #ssc-overlay .ssc-kicker{font:10px Arial,sans-serif;letter-spacing:.22em;color:#e4bb8c;text-transform:uppercase;margin-bottom:5px}
  #ssc-overlay .ssc-sub{margin:0;color:#baaabf;font:13px/1.5 Arial,sans-serif}
  #ssc-overlay .ssc-close{border:1px solid #715b76;color:#eedfe9;background:#42344c;width:36px;height:36px;border-radius:9px;cursor:pointer;font-size:24px;line-height:1}
  #ssc-overlay .ssc-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px}
  #ssc-overlay input,#ssc-overlay select,#ssc-overlay textarea{font:13px Arial,sans-serif!important;color:#f7edf7!important;background:#241b2d!important;border:1px solid #65516c!important;border-radius:8px!important;padding:9px 10px!important;max-width:100%}
  #ssc-overlay input:focus,#ssc-overlay select:focus,#ssc-overlay textarea:focus{outline:2px solid #bf9fc8;outline-offset:1px}
  #ssc-overlay input[type=number]{width:116px}
  #ssc-overlay input[type=search]{min-width:155px;flex:1}
  #ssc-overlay button{font:600 12px Arial,sans-serif;cursor:pointer}
  #ssc-overlay .ssc-btn{padding:10px 12px;background:#42334e;color:#f5ebf7;border:1px solid #6d5576;border-radius:8px;min-height:35px}
  #ssc-overlay .ssc-btn:hover{background:#5b4767}
  #ssc-overlay .ssc-primary{background:#c6a6b9;color:#241628;border-color:#e0c0d2}
  #ssc-overlay .ssc-btn:disabled{opacity:.45;cursor:default}
  #ssc-overlay .ssc-info{padding:8px 24px;background:#251e2d;border-bottom:1px solid #443649;display:flex;gap:12px;justify-content:space-between;align-items:center;color:#d3c4d4;font:12px Arial,sans-serif;flex-wrap:wrap}
  #ssc-overlay .ssc-settings{padding:0 24px;background:#211b29;border-bottom:1px solid #3f3447;color:#c5b2c6;font:12px/1.5 Arial,sans-serif}
  #ssc-overlay .ssc-settings summary{cursor:pointer;padding:8px 0;color:#d5b7d8}
  #ssc-overlay .ssc-section-rules{display:flex;flex-wrap:wrap;gap:9px;padding-bottom:12px}
  #ssc-overlay .ssc-section-rule{display:flex;gap:6px;align-items:center;border:1px solid #53445c;border-radius:8px;padding:6px 7px}
  #ssc-overlay .ssc-section-rule select{font-size:11px!important;padding:4px 5px!important}
  #ssc-overlay .ssc-content{overflow:auto;flex:1;min-height:0;padding:19px 24px}
  #ssc-overlay .ssc-board{display:flex;flex-direction:column;gap:19px}
  #ssc-overlay .ssc-column{border:1px solid #504255;background:#251e2f;border-radius:13px;padding:14px 16px;transition:background .15s,border-color .15s;min-height:115px}
  #ssc-overlay .ssc-column.ssc-over{border-color:#f0c69d;background:#3b2c44}
  #ssc-overlay .ssc-coltitle{margin:0 0 11px;display:flex;justify-content:space-between;gap:10px;font:normal 22px Georgia,serif;color:#f0d5c6;border-bottom:1px solid #514057;padding-bottom:11px}
  #ssc-overlay .ssc-count{color:#c4b0c4;font:12px Arial,sans-serif}
  #ssc-overlay .ssc-list{display:flex;flex-direction:column;gap:8px}
  #ssc-overlay .ssc-card{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:12px;align-items:center;background:#30273a;border:1px solid #5a4862;border-left:3px solid #c4a7be;border-radius:9px;padding:10px 12px;cursor:grab}
  #ssc-overlay .ssc-card:active{cursor:grabbing}
  #ssc-overlay .ssc-card.ssc-moving{opacity:.5}
  #ssc-overlay .ssc-card a{color:#f6eaf1!important;text-decoration:none!important;font:normal 15px/1.4 Georgia,serif!important;word-break:break-word}
  #ssc-overlay .ssc-card a:hover{text-decoration:underline!important}
  #ssc-overlay .ssc-card-date{color:#e1c4a3;font:12px/1.4 Arial,sans-serif;overflow-wrap:anywhere}
  #ssc-overlay .ssc-card-content{min-width:0}
  #ssc-overlay .ssc-meta{color:#c5b5ca;font:11px/1.55 Arial,sans-serif;overflow-wrap:anywhere;margin-top:5px}
  #ssc-overlay .ssc-note{color:#af9bb5;font-style:italic}
  #ssc-overlay .ssc-tags{display:flex;flex-wrap:wrap;gap:7px;align-items:center}
  #ssc-overlay .ssc-tag{background:#42364c;color:#e3c7e9;border-radius:4px;padding:3px 6px;font:10px Arial,sans-serif;display:inline-block;margin-right:6px}
  #ssc-overlay .ssc-card-controls{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
  #ssc-overlay .ssc-card-controls select{font-size:11px!important;padding:6px!important;max-width:150px}
  #ssc-overlay .ssc-mini{background:transparent;color:#e8cbe6;border:1px solid #745b7b;padding:6px 8px;border-radius:7px}
  #ssc-overlay .ssc-flag{font:10px/1.5 Arial,sans-serif;color:#e5b48f;display:block;margin-top:6px}
  #ssc-overlay .ssc-empty{color:#9d8fa2;font:12px/1.6 Arial,sans-serif;text-align:center;padding:17px 10px}
  #ssc-overlay .ssc-footer{padding:10px 24px;border-top:1px solid #493951;background:#241c2e;color:#b0a3b5;font:11px/1.5 Arial,sans-serif}
  #ssc-overlay .ssc-export{display:none;max-height:60%;overflow-y:auto;border-top:1px solid #514358;padding:14px 24px;background:#241c2d}
  #ssc-overlay .ssc-export.is-open{display:block}
  #ssc-overlay .ssc-exportrow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  #ssc-overlay .ssc-export textarea{display:block;width:100%;height:130px;resize:vertical;margin:9px 0}
  #ssc-overlay .ssc-preview{margin-top:11px;max-height:320px;overflow:auto;background:#eee8e9;border:1px solid #746275;border-radius:9px;padding:15px;isolation:isolate}
  #ssc-overlay .ssc-exporthint{font:11px/1.5 Arial,sans-serif;color:#cbbac9;margin:7px 0}
  #ssc-overlay .ssc-editor{display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:#130d1aea;padding:14px}
  #ssc-overlay .ssc-editor.is-open{display:flex}
  #ssc-overlay .ssc-editbox{width:min(570px,100%);max-height:90vh;overflow:auto;padding:23px;background:#33283e;border:1px solid #8c7592;border-radius:14px}
  #ssc-overlay .ssc-editbox h3{font:normal 23px Georgia,serif!important;color:#f4e8f4!important;margin:0 0 17px!important}
  #ssc-overlay .ssc-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  #ssc-overlay label.ssc-field{display:flex;flex-direction:column;gap:7px;color:#d0bfce;font:12px Arial,sans-serif}
  #ssc-overlay label.ssc-full{grid-column:1/-1}
  #ssc-overlay label.ssc-field input,#ssc-overlay label.ssc-field select,#ssc-overlay label.ssc-field textarea{width:100%}
  #ssc-overlay .ssc-editactions{display:flex;gap:8px;justify-content:flex-end;margin-top:17px}
  #ssc-overlay .ssc-warn{font-size:12px;line-height:1.6;color:#dfb3a4;margin-top:10px}
  @media(max-width:820px){#ssc-overlay .ssc-card{grid-template-columns:130px minmax(0,1fr)}#ssc-overlay .ssc-card-controls{grid-column:1/-1;justify-content:flex-start}}
  @media(max-width:600px){#ssc-overlay{padding:0}#ssc-overlay .ssc-shell{height:100dvh;border-radius:0}#ssc-overlay .ssc-head{padding:15px}#ssc-overlay .ssc-content{padding:12px}#ssc-overlay .ssc-info{padding:9px 15px}#ssc-overlay .ssc-settings{padding:0 15px}#ssc-overlay .ssc-column{padding:11px}#ssc-overlay .ssc-card{grid-template-columns:1fr;gap:6px}#ssc-overlay .ssc-card-controls{grid-column:1;justify-content:flex-start}#ssc-overlay .ssc-coltitle{font-size:19px}#ssc-overlay .ssc-fields{grid-template-columns:1fr}#ssc-overlay .ssc-footer{padding:9px 15px}#ssc-overlay .ssc-export{padding:10px 15px}}
  /* INLINE MODE: widget is part of the thread's first post, never a viewport modal. */
  #ssc-chronology-root{display:block!important;max-width:100%;width:100%;clear:both;margin:18px auto 22px;position:relative;z-index:1}
  #ssc-overlay.ssc-embedded{position:relative!important;inset:auto!important;background:transparent!important;
    z-index:1!important;display:block!important;padding:0!important;width:100%!important;max-width:100%;
    color:#f2e7f3;text-align:left;overflow:visible}
  #ssc-overlay.ssc-embedded .ssc-shell{width:100%!important;height:auto!important;max-height:none!important;
    min-height:340px;box-shadow:none!important;overflow:visible;position:relative}
  #ssc-overlay.ssc-embedded .ssc-content{overflow:visible!important;flex:0 1 auto!important;min-height:140px}
  #ssc-overlay.ssc-embedded .ssc-export{max-height:none!important}
  #ssc-overlay.ssc-embedded .ssc-editor{position:fixed!important;inset:0!important;z-index:2147483645!important;overflow:auto}
  #ssc-overlay.ssc-embedded .ssc-editbox{margin:auto}
  #ssc-overlay.ssc-embedded .ssc-close{display:none!important}
  #ssc-overlay.ssc-embedded .ssc-actions input[type=search]{min-width:125px}
  #ssc-overlay.ssc-embedded button, #ssc-overlay.ssc-embedded input, #ssc-overlay.ssc-embedded textarea, #ssc-overlay.ssc-embedded select{letter-spacing:normal;text-transform:none}
  #ssc-overlay.ssc-embedded button:focus-visible{outline:2px solid #f0c69d;outline-offset:2px}
  @media(max-width:600px){#ssc-chronology-root{margin:10px auto}#ssc-overlay.ssc-embedded .ssc-shell{border-radius:12px}}
  `;
  const style=document.createElement('style');style.textContent=css; document.head.appendChild(style);
  const overlay=document.createElement('div');overlay.id='ssc-overlay';overlay.innerHTML=`<div class="ssc-shell" role="dialog" aria-modal="true" aria-label="Хронология персонажа">
    <div class="ssc-head"><div class="ssc-heading"><div><div class="ssc-kicker">Marauders · Safe Space</div><h2>Хронология персонажа</h2><p class="ssc-sub">Все эпизоды по игровой дате · три последовательных раздела · оформление для форума</p></div><button class="ssc-close" type="button" id="ssc-close" title="Закрыть">×</button></div>
      <div class="ssc-actions"><input id="ssc-user" type="number" min="1" step="1" placeholder="ID игрока" aria-label="ID игрока"><button id="ssc-scan" class="ssc-btn ssc-primary" type="button">Собрать эпизоды</button><button id="ssc-stop" class="ssc-btn" disabled type="button">Стоп</button><input id="ssc-filter" type="search" placeholder="Название / участник / дата"><button id="ssc-add" class="ssc-btn" type="button">+ Эпизод</button><button id="ssc-export-btn" class="ssc-btn" type="button">✦ Готовый HTML</button><button id="ssc-download" class="ssc-btn" type="button">JSON ↓</button><button id="ssc-import-btn" class="ssc-btn" type="button">JSON ↑</button><input type="file" id="ssc-import" accept="application/json,.json" hidden></div>
    </div><div class="ssc-info"><span id="ssc-progress">Готово к сбору</span><span id="ssc-stat">0 эпизодов</span></div>
    <details class="ssc-settings" id="ssc-settings"><summary>Настройка привязки форумных разделов (5, 8, 9, 17, 18, 19, 22)</summary><div class="ssc-section-rules" id="ssc-section-rules">Названия разделов появятся после проверки доступа.</div></details>
    <div class="ssc-content"><div class="ssc-board" id="ssc-board"></div></div>
    <div class="ssc-export" id="ssc-export"><div class="ssc-exportrow"><strong>Код для форумного сообщения</strong><label>Оформление <select id="ssc-theme"><option value="night">Ночная сирень</option><option value="parchment">Старинный пергамент</option></select></label><label style="display:flex;align-items:center;gap:4px"><input id="ssc-html-tags" type="checkbox" checked> Добавить [html][/html]</label><button id="ssc-copy" type="button" class="ssc-btn ssc-primary">Копировать HTML</button><button id="ssc-download-html" type="button" class="ssc-btn">Скачать HTML</button></div><p class="ssc-exporthint">Финальный блок статичен: его можно вставить в сообщение и он будет работать без скрипта конструктора. Кнопки редактирования в пост не попадают.</p><textarea id="ssc-out" readonly></textarea><div class="ssc-preview" id="ssc-preview"></div></div>
    <div class="ssc-footer">Перетаскивайте эпизоды между тремя разделами или меняйте расположение через меню на карточке. Личные и сюжетные автоматически смешиваются в «Хронологии». Данные сохраняются в этом браузере. <button id="ssc-clear" class="ssc-btn" type="button" style="margin-left:9px;padding:5px 8px">Очистить данные</button></div>
    <div class="ssc-editor" id="ssc-editor"><form class="ssc-editbox" id="ssc-form"><h3 id="ssc-form-title">Эпизод</h3><div class="ssc-fields">
      <label class="ssc-field ssc-full">Название<input name="title" required maxlength="240"></label>
      <label class="ssc-field ssc-full">Ссылка на тему<input name="url" placeholder="https://safespace.rusff.me/viewtopic.php?id=…"></label>
      <label class="ssc-field">Игровая дата<input name="date" placeholder="Например: 15 ноября 1979"></label>
      <label class="ssc-field">В какую строку поместить<select name="view"><option value="timeline">Хронология</option><option value="alternative">Альтернатива</option><option value="unfinished">Незавершённые</option></select></label>
      <label class="ssc-field">Тип эпизода<select name="category"><option value="personal">Личный</option><option value="plot">Сюжетный</option><option value="alternative">Альтернативный</option></select></label>
      <label class="ssc-field">Статус<select name="status"><option value="ongoing">В процессе</option><option value="finished">Закрыт</option><option value="abandoned">Заброшен</option></select></label>
      <label class="ssc-field ssc-full">Участники<input name="participants" placeholder="Имена через запятую"></label>
      <label class="ssc-field ssc-full">Примечание<textarea name="notes" rows="2" placeholder="Необязательно"></textarea></label>
    </div><div class="ssc-warn" id="ssc-edit-warn"></div><div class="ssc-editactions"><button class="ssc-btn" type="button" id="ssc-delete">Удалить из списка</button><button class="ssc-btn" type="button" id="ssc-cancel">Отмена</button><button class="ssc-btn ssc-primary" type="submit">Сохранить</button></div></form></div>
    </div>`;
  if (isTargetTopic) {
    // Optional exact placement: [html]<div id="ssc-chronology-root"></div>[/html]
    // Otherwise render automatically at the top of the first post.
    let host=document.getElementById('ssc-chronology-root');
    if (!host) {
      host=document.createElement('div');
      host.id='ssc-chronology-root';
      const firstPost=[
        '#pun-viewtopic .post .post-content', '#pun-main .post .post-content',
        '#pun-viewtopic .post-content', '#pun-main .post-content',
        '#pun-viewtopic .post', '#pun-main'
      ].map(selector=>document.querySelector(selector)).find(Boolean);
      if (firstPost) firstPost.insertBefore(host,firstPost.firstChild);
      else document.body.appendChild(host);
    }
    host.appendChild(overlay);
    overlay.classList.add('ssc-embedded','is-open');
    const shell=overlay.querySelector('.ssc-shell');
    shell.setAttribute('role','region');
    shell.removeAttribute('aria-modal');
    overlay.querySelector('#ssc-close').hidden=true;
  } else {
    document.body.appendChild(overlay);
  }
  const byId=id=>overlay.querySelector('#'+id);
  const storageKey=id=>STORAGE_KEY+id;
  const effectiveView=x=>VIEW[x.view]?x.view:(x.category==='alternative'?'alternative':'timeline');
  const sortItems=a=>a.sort((x,y)=>(x.dateKey||'9999').localeCompare(y.dateKey||'9999') || String(x.title||'').localeCompare(String(y.title||''),'ru'));
  function save(){if(!states.id)return;try{localStorage.setItem(storageKey(states.id),JSON.stringify({id:states.id,items:states.items,name:states.name,sections:states.sections,theme:states.theme}));}catch(e){showStatus('Не удалось сохранить локально — экспортируйте JSON.');}}
  function restore(id){
    states.id=String(id);states.items=[];states.name='';states.sections={};states.theme='night';
    try{
      const raw=localStorage.getItem(storageKey(states.id))||localStorage.getItem(LEGACY_KEY+states.id)||'null';
      const data=JSON.parse(raw);
      if(data&&Array.isArray(data.items)){
        states.items=data.items.filter(x=>x&&x.id!=null&&CAT[x.category]).map(x=>({...x,id:String(x.id),title:String(x.title||'Без названия'),view:VIEW[x.view]?x.view:(x.category==='alternative'?'alternative':'timeline'),override:x.override||{},status:STATUS[x.status]?x.status:'ongoing',dateKey:dateInfo(x.date).key}));
        states.name=data.name||'';states.sections=data.sections||{};states.theme=data.theme||'night';
      }
    }catch(e){}
    if(byId('ssc-theme'))byId('ssc-theme').value=states.theme;
    renderSections();render();
  }
  function showStatus(message){states.status=message;byId('ssc-progress').textContent=message;}
  function renderSections(){
    const lines=[];
    for(const id of SECTIONS){
      const rule=states.sections?.[id]||{};
      const label=rule.label|| (ROOTS[id]?CAT[ROOTS[id]]:'Раздел '+id);
      const value=rule.view||((id===9)?'alternative':'timeline');
      lines.push(`<label class="ssc-section-rule">#${id} ${esc(label)} <select data-section-rule="${id}">${Object.entries(VIEW).map(([v,name])=>`<option value="${v}" ${value===v?'selected':''}>${name}</option>`).join('')}</select></label>`);
    }
    byId('ssc-section-rules').innerHTML=lines.join('');
  }
  function render(){
    const t=states.filter.toLowerCase();let html='';
    for(const [view,heading] of Object.entries(VIEW)){
      const all=sortItems(states.items.filter(x=>effectiveView(x)===view));
      const items=all.filter(x=>!t||[x.title,x.participants,x.date,x.notes].join(' ').toLowerCase().includes(t));
      html+=`<section class="ssc-column" data-view="${view}"><div class="ssc-coltitle"><span>${heading}</span><span class="ssc-count">${items.length}${t?' / '+all.length:''} эп.</span></div><div class="ssc-list">`;
      if(!items.length)html+='<div class="ssc-empty">Эпизодов пока нет · перетащите карточку сюда или добавьте вручную</div>';
      for(const x of items){
        const url=safeURL(x.url||'');
        const type=CAT[x.category]||'Не указан';
        html+=`<article class="ssc-card" draggable="true" data-id="${esc(x.id)}"><div class="ssc-card-date">${esc(x.date||'Дата не указана')}</div><div class="ssc-card-content"><div>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>`:`<span style="font:15px Georgia,serif">${esc(x.title)}</span>`}</div><div class="ssc-meta"><span class="ssc-tag">${esc(type)}</span>Участники: ${esc(x.participants||'Не определены')}</div>${x.notes?`<div class="ssc-meta ssc-note">${esc(x.notes)}</div>`:''}${(x.dateUncertain||x.statusUncertain||x.viewUncertain)?`<span class="ssc-flag">⚑ ${[x.dateUncertain?'проверьте дату':'',x.statusUncertain?'проверьте статус':'',x.viewUncertain?'проверьте раздел':''].filter(Boolean).join(' · ')}</span>`:''}</div><div class="ssc-card-controls"><select data-field="status" data-id="${esc(x.id)}" title="Статус">${Object.entries(STATUS).map(([v,label])=>`<option value="${v}" ${x.status===v?'selected':''}>${label}</option>`).join('')}</select><select data-field="view" data-id="${esc(x.id)}" title="Переместить в раздел">${Object.entries(VIEW).map(([v,label])=>`<option value="${v}" ${view===v?'selected':''}>${label}</option>`).join('')}</select><button class="ssc-mini" type="button" data-edit="${esc(x.id)}">Изменить</button></div></article>`;
      }
      html+='</div></section>';
    }
    byId('ssc-board').innerHTML=html;
    byId('ssc-stat').textContent=`${states.items.length} эпизодов${states.name?' · '+states.name:''}`;
    if(byId('ssc-export').classList.contains('is-open'))updateExport();
  }
  function exportHTML(){
    const theme=byId('ssc-theme')?.value==='parchment'?'parchment':'night';
    const cards=(view)=>sortItems(states.items.filter(x=>effectiveView(x)===view)).map(x=>{
      const url=safeURL(x.url||'');
      const t=url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>`:`<strong>${esc(x.title)}</strong>`;
      const type=(x.category==='plot'?'сюжет':x.category==='personal'?'личный':'альтернатива');
      return `<div class="sscp-line"><div class="sscp-date">${esc(x.date||'дата не указана')}</div><div class="sscp-main"><div class="sscp-title">${t}</div><div class="sscp-players">${esc(x.participants||'Участники не указаны')}</div>${x.notes?`<div class="sscp-note">${esc(x.notes)}</div>`:''}</div><div class="sscp-labels"><span class="sscp-type">${type}</span><span class="sscp-status sscp-${esc(x.status)}">${esc(STATUS[x.status]||STATUS.ongoing)}</span></div></div>`;
    }).join('');
    // CSS is scoped. Public output has no interactive code or network requests.
    const css=`<style>
#sschron-post{max-width:860px;width:100%;box-sizing:border-box;margin:0 auto;padding:28px 26px 32px;background:#211a2b;color:#e9dce9;border:1px solid #6f5475;border-radius:17px;font:14px/1.5 Georgia,serif;overflow:hidden}
#sschron-post *{box-sizing:border-box}
#sschron-post .sscp-kicker{text-transform:uppercase;letter-spacing:3px;font:10px Arial,sans-serif;color:#d3b28c;text-align:center}
#sschron-post .sscp-heading{color:#f3e1ee;text-align:center;font:normal 31px/1.15 Georgia,serif;margin:9px 0 7px;padding:0;letter-spacing:.3px}
#sschron-post .sscp-character{text-align:center;font:italic 13px Georgia,serif;color:#c9b7c9;margin:0 0 25px}
#sschron-post .sscp-divider{height:1px;background:linear-gradient(90deg,transparent,#8c708b,transparent);margin:18px 0 22px}
#sschron-post .sscp-section{margin:0 0 26px}
#sschron-post .sscp-section:last-child{margin:0}
#sschron-post .sscp-section-title{padding:0 0 10px;border-bottom:1px solid #68546c;margin:0 0 10px;color:#dfbbad;text-transform:uppercase;letter-spacing:2px;font:normal 18px Georgia,serif}
#sschron-post .sscp-line{display:grid;grid-template-columns:133px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 8px;border-bottom:1px solid #46374f;min-width:0}
#sschron-post .sscp-line:last-child{border-bottom:0}
#sschron-post .sscp-date{font:12px/1.4 Arial,sans-serif;color:#d6b79b;overflow-wrap:anywhere}
#sschron-post .sscp-title{font:normal 16px/1.35 Georgia,serif;margin:0 0 5px;color:#f7e8f0;overflow-wrap:anywhere}
#sschron-post .sscp-title a{color:#f7e8f0!important;text-decoration:none!important;border-bottom:1px dotted #a890b2}
#sschron-post .sscp-players{font:11px/1.5 Arial,sans-serif;color:#bdafc3;overflow-wrap:anywhere}
#sschron-post .sscp-note{font:italic 11px/1.5 Georgia,serif;color:#aa96ae;margin-top:4px;overflow-wrap:anywhere}
#sschron-post .sscp-labels{display:flex;gap:5px;align-items:flex-end;flex-direction:column}
#sschron-post .sscp-type,#sschron-post .sscp-status{white-space:nowrap;border-radius:4px;font:10px/1.4 Arial,sans-serif;padding:3px 6px;background:#3d3048;color:#d8c0d6}
#sschron-post .sscp-finished{background:#30483c;color:#b9dfc8}
#sschron-post .sscp-abandoned{background:#52363b;color:#e3b5b0}
#sschron-post .sscp-empty{padding:12px;color:#af9bb6;font:italic 12px Georgia,serif}
#sschron-post .sscp-footer{margin-top:23px;color:#ad98ac;letter-spacing:2px;text-transform:uppercase;text-align:center;font:9px Arial,sans-serif}
#sschron-post[data-theme="parchment"]{background:#eee2c9;border-color:#bda884;color:#554232}
#sschron-post[data-theme="parchment"] .sscp-kicker,#sschron-post[data-theme="parchment"] .sscp-date{color:#966b48}
#sschron-post[data-theme="parchment"] .sscp-heading,#sschron-post[data-theme="parchment"] .sscp-title,#sschron-post[data-theme="parchment"] .sscp-title a{color:#503b37!important}
#sschron-post[data-theme="parchment"] .sscp-character,#sschron-post[data-theme="parchment"] .sscp-players,#sschron-post[data-theme="parchment"] .sscp-note,#sschron-post[data-theme="parchment"] .sscp-footer{color:#7d6859}
#sschron-post[data-theme="parchment"] .sscp-section-title{color:#7c544b;border-color:#c4b293}
#sschron-post[data-theme="parchment"] .sscp-line{border-color:#d1c09d}
#sschron-post[data-theme="parchment"] .sscp-type,#sschron-post[data-theme="parchment"] .sscp-status{background:#d9c8b0;color:#57483c}
#sschron-post[data-theme="parchment"] .sscp-finished{background:#ccdac9;color:#3b6846}
#sschron-post[data-theme="parchment"] .sscp-abandoned{background:#e5c9c2;color:#87493e}
@media(max-width:600px){#sschron-post{padding:19px 12px;border-radius:8px}#sschron-post .sscp-heading{font-size:26px}#sschron-post .sscp-line{grid-template-columns:1fr;gap:5px;padding:12px 3px}#sschron-post .sscp-labels{flex-direction:row;align-items:center}#sschron-post .sscp-section-title{font-size:17px}}
</style>`;
    const sections=Object.entries(VIEW).map(([key,label])=>{
      const body=cards(key);const n=states.items.filter(x=>effectiveView(x)===key).length;
      return `<section class="sscp-section"><div class="sscp-section-title">✧ ${label} <span style="font-size:11px;letter-spacing:0;opacity:.7">(${n})</span></div>${body||'<div class="sscp-empty">Пока нет эпизодов</div>'}</section>`;
    }).join('');
    const content=`${css}
<div id="sschron-post" data-theme="${theme}"><div class="sscp-kicker">Marauders · Safe Space</div><div class="sscp-heading">Хронология персонажа</div><div class="sscp-character">${esc(states.name||'История магических приключений')}</div><div class="sscp-divider"></div>${sections}<div class="sscp-footer">The rest is still unwritten</div></div>`;
    return content;
  }
  function updateExport(){
    const html=exportHTML();
    byId('ssc-out').value=byId('ssc-html-tags').checked?'[html]\n'+html+'\n[/html]':html;
    byId('ssc-preview').innerHTML=html;
  }
  const setBusy=b=>{states.scanning=b;byId('ssc-scan').disabled=b;byId('ssc-stop').disabled=!b;byId('ssc-user').disabled=b;};
  async function loadProfile(id){
    try{const {doc}=await getPage('/profile.php?id='+id); const n=getText(doc.querySelector('#pun-profile h1, #profile-right h1, #pun-main h1'));
      return n&&n.toLowerCase()!=='информация'?n:'';
    }catch(e){return '';}
  }
  async function loadSectionMap(){
    const map={};let skipped=0;
    for(const id of SECTIONS){
      if(controller?.signal.aborted)break;
      try{
        const {doc}=await getPage('/viewforum.php?id='+id);
        const name=getText(doc.querySelector('#pun-viewforum h1, #pun-main h1'))||getText(doc.querySelector('.crumbs strong'))||'Раздел '+id;
        const crumbs=getCrumbs(doc);
        let category=ROOTS[id]||crumbs.map(x=>ROOTS[x.id]).find(Boolean)||categoryFor(name+' '+crumbs.map(x=>x.label).join(' '));
        const view=states.sections?.[id]?.view || (isUnfinished(name+' '+crumbs.map(x=>x.label).join(' '))?'unfinished':category==='alternative'?'alternative':'timeline');
        map[id]={id,label:name,category:category||'',view,status:statusFor(name+' '+crumbs.map(x=>x.label).join(' '))};
      }catch(e){skipped++;map[id]={id,label:'Раздел '+id,category:ROOTS[id]||'',view:states.sections?.[id]?.view||(id===9?'alternative':'timeline'),status:''};}
      await pause(110);
    }
    for(const id of SECTIONS){const old=states.sections?.[id]||{};states.sections[id]={...map[id],view:old.view||map[id].view};}
    renderSections();
    if(skipped)states.errors.push('Недоступны разделы: '+skipped+' из 7.');
    return map;
  }
  async function resolvePid(link){
    try{const {finalUrl}=await getPage(link);return topicId(finalUrl);}catch(e){return null;}
  }
  async function scan(){
    const id=String(byId('ssc-user').value||'').trim();
    if(!/^\d{1,12}$/.test(id)||Number(id)<1){showStatus('Введите числовой ID персонажа из ссылки на профиль.');return;}
    if(!isForum()){showStatus('Автосбор работает только внутри safespace.rusff.me. Откройте конструктор на форуме.');return;}
    if(states.id!==id)restore(id);
    states.errors=[];states.log='';controller=new AbortController();setBusy(true);
    const overrides=new Map(states.items.map(x=>[String(x.id),x]));
    const newItems=[];
    try{
      showStatus('Проверка доступа и разделов…');
      const sections=await loadSectionMap();
      states.name=await loadProfile(id);render();
      showStatus('Поиск сообщений персонажа…');
      const queue=[forumUrl('/search.php?action=show_user_posts&user_id='+encodeURIComponent(id))],visited=new Set(),found=new Map(),unresolved=new Set();
      let pageCount=0,searchError='';
      while(queue.length&&pageCount<MAX_SEARCH_PAGES){
        if(controller.signal.aborted)throw new DOMException('Остановлено','AbortError');
        const url=queue.shift();if(visited.has(url))continue;visited.add(url);
        let result;
        try{result=await getPage(url);}catch(e){searchError=e.message;break;}
        const x=searchLinks(result.doc,id);pageCount++;
        x.topics.forEach((v,k)=>found.set(k,v));x.pids.forEach(url=>unresolved.add(url));
        x.pages.forEach(url=>{if(!visited.has(url)&&!queue.includes(url))queue.push(url);});
        showStatus(`Поиск: страниц ${pageCount}, тем ${found.size}, ссылок на посты ${unresolved.size}…`);
        await pause(130);
      }
      if(pageCount===MAX_SEARCH_PAGES)states.errors.push('Лимит '+MAX_SEARCH_PAGES+' страниц поиска достигнут. Выборка может быть неполной.');
      if(searchError)states.errors.push('Поиск прерван: '+searchError);
      if(!pageCount)throw new Error(searchError||'Не удалось открыть поиск по пользователю.');
      if(unresolved.size){
        // Rusff may return a mixture of topic and post links; resolve both.
        for(const pid of unresolved){
          if(controller.signal.aborted)throw new DOMException('Остановлено','AbortError');
          if(found.size>=MAX_EPISODES)break;
          const topic=await resolvePid(pid);if(topic&&!found.has(topic))found.set(topic,{id:topic,title:''});
          await pause(130);
        }
      }
      if(!found.size){
        showStatus('Поиск не вернул тем. Возможно, у персонажа нет сообщений или поиск недоступен.');
        return;
      }
      showStatus(`Найдено ${found.size} тем. Читаю шапки эпизодов…`);
      let checked=0, matched=0,failed=0;
      for(const [topic,v] of found){
        if(controller.signal.aborted)throw new DOMException('Остановлено','AbortError');
        if(checked>=MAX_EPISODES){states.errors.push('Достигнут лимит '+MAX_EPISODES+' тем.');break;}
        checked++;
        try{
          const {doc}=await getPage('/viewtopic.php?id='+topic);
          const crumbs=getCrumbs(doc);const match=crumbs.find(x=>SECTIONS.includes(x.id));
          if(!match){await pause(100);continue;}
          let ep=parseEpisode(doc,topic,sections[match.id]||match,v);
          const s=sections[match.id];
          if(ep.categoryUncertain&&s?.category){ep.category=s.category;ep.categoryUncertain=false;}
          if(ep.statusUncertain&&s?.status){ep.status=s.status;ep.statusUncertain=false;}
          if(s?.view){ep.view=s.view;ep.viewUncertain=false;}
          // Add participant names from the last page for multi-page threads.
          if(ep.pages>1&&ep.participantsSource.startsWith('Авторы')){
            try{
              const last=await getPage('/viewtopic.php?id='+topic+'&p='+ep.pages);
              const authors=[...new Set([...ep.authors,...parseAuthors(last.doc)])];
              ep.participants=authors.join(', ');ep.authors=authors;
            }catch(e){}
          }
          // Manual fields survive rescanning.
          const old=overrides.get(String(topic));
          if(old){
            ep.override=old.override||{};
            for(const f of ['title','date','participants','category','view','status','notes','url'])if(ep.override[f])ep[f]=old[f];
            ep.dateKey=dateInfo(ep.date).key;
            if(ep.override.date)ep.dateUncertain=false;
            if(ep.override.status)ep.statusUncertain=false;
            if(ep.override.category)ep.categoryUncertain=false;
            if(ep.override.view)ep.viewUncertain=false;
          }
          newItems.push(ep);matched++;
          states.items=[...newItems,...states.items.filter(x=>x.manual&&!newItems.some(y=>y.id===x.id))];
          if(checked%3===0)render();
        }catch(e){failed++;states.errors.push('Тема #'+topic+': '+e.message);}
        showStatus(`Обработано ${checked}/${found.size} · игровых эпизодов: ${matched} · ошибок: ${failed}`);
        await pause(180);
      }
      const manualOld=[...overrides.values()].filter(x=>x.manual&&!newItems.some(y=>y.id===x.id));
      states.items=[...newItems,...manualOld];save();render();
      showStatus(`Готово: ${matched} эпизодов из ${checked} проверенных тем.${states.errors.length?' Предупреждений: '+states.errors.length+'.':''}`);
      if(states.errors.length)console.warn('SAFE SPACE chronology:',states.errors.slice(0,100));
    }catch(e){
      if(e.name==='AbortError'){save();render();showStatus(`Сбор остановлен. Частично собрано: ${states.items.length} эпизодов.`);}
      else{showStatus('Ошибка: '+e.message);states.errors.push(e.message);}
    }finally{setBusy(false);controller=null;}
  }
  let editingId=null;
  function edit(id){
    const item=states.items.find(x=>x.id===id)||null;
    editingId=item?.id||null;
    const form=byId('ssc-form');
    form.elements.title.value=item?.title||'';
    form.elements.url.value=item?.url||'';
    form.elements.date.value=item?.date||'';
    form.elements.category.value=item?.category||'personal';
    form.elements.view.value=item?.view||'timeline';
    form.elements.status.value=item?.status||'ongoing';
    form.elements.participants.value=item?.participants||'';
    form.elements.notes.value=item?.notes||'';
    byId('ssc-form-title').textContent=item?'Редактировать эпизод':'Добавить эпизод';
    byId('ssc-delete').hidden=!item;
    byId('ssc-edit-warn').textContent=item?`Источник: ${item.sectionName||'вручную'}. Участники: ${item.participantsSource||'указаны вручную'}. Изменения не редактируют темы форума.`:'';
    byId('ssc-editor').classList.add('is-open');form.elements.title.focus();
  }
  function closeEdit(){byId('ssc-editor').classList.remove('is-open');editingId=null;}
  function download(filename,content,mime){
    const blob=new Blob([content],{type:mime});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  }
  byId('ssc-close').addEventListener('click',()=>{if(!isTargetTopic)overlay.classList.remove('is-open');});
  overlay.addEventListener('click',e=>{if(e.target===overlay&&!isTargetTopic)overlay.classList.remove('is-open');});
  byId('ssc-user').addEventListener('change',e=>{if(/^\d+$/.test(e.target.value)&&!states.scanning)restore(e.target.value);});
  byId('ssc-scan').addEventListener('click',scan);
  byId('ssc-stop').addEventListener('click',()=>controller?.abort());
  byId('ssc-filter').addEventListener('input',e=>{states.filter=e.target.value;render();});
  byId('ssc-add').addEventListener('click',()=>edit(null));
  byId('ssc-export-btn').addEventListener('click',()=>{byId('ssc-export').classList.toggle('is-open');if(byId('ssc-export').classList.contains('is-open')){updateExport();byId('ssc-export').scrollIntoView({block:'nearest',behavior:'smooth'});}});
  byId('ssc-theme').addEventListener('change',e=>{states.theme=e.target.value;save();updateExport();});
  byId('ssc-html-tags').addEventListener('change',updateExport);
  byId('ssc-copy').addEventListener('click',async()=>{
    const value=byId('ssc-out').value;
    try{await navigator.clipboard.writeText(value);showStatus('HTML для форума скопирован.');}
    catch(e){byId('ssc-out').focus();byId('ssc-out').select();document.execCommand('copy');showStatus('HTML выделен — можно скопировать.');}
  });
  byId('ssc-download-html').addEventListener('click',()=>download('safe-space-timeline-'+(states.id||'draft')+'.html',exportHTML(),'text/html;charset=utf-8'));
  byId('ssc-section-rules').addEventListener('change',e=>{
    const el=e.target.closest('select[data-section-rule]');if(!el)return;
    const id=Number(el.dataset.sectionRule);
    if(!SECTIONS.includes(id)||!VIEW[el.value])return;
    states.sections[id]={...(states.sections[id]||{}),view:el.value};
    for(const ep of states.items){if(Number(ep.sectionId)===id&&!ep.override?.view){ep.view=el.value;ep.viewUncertain=false;}}
    save();render();showStatus('Распределение раздела #'+id+' изменено.');
  });
  byId('ssc-download').addEventListener('click',()=>download('safe-space-chronology-'+(states.id||'draft')+'.json',JSON.stringify({version:2,id:states.id,name:states.name,items:states.items,sections:states.sections,theme:byId('ssc-theme').value},null,2),'application/json'));
  byId('ssc-import-btn').addEventListener('click',()=>byId('ssc-import').click());
  byId('ssc-import').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const data=JSON.parse(await file.text());if(!data||!Array.isArray(data.items))throw new Error('В файле нет списка items');
      if(!data.id||!/^\d+$/.test(String(data.id)))throw new Error('Не указан корректный id');
      states.id=String(data.id);byId('ssc-user').value=states.id;
      states.name=String(data.name||'');
      states.items=data.items.filter(x=>x&&String(x.id||'')&&CAT[x.category]).map(x=>({...x,id:String(x.id),view:VIEW[x.view]?x.view:(x.category==='alternative'?'alternative':'timeline'),title:String(x.title||'Без названия'),dateKey:dateInfo(x.date).key,override:x.override||{},status:STATUS[x.status]?x.status:'ongoing'}));
      states.sections=data.sections||{};states.theme=data.theme||'night';renderSections();byId('ssc-theme').value=states.theme;
      save();render();showStatus('Импортировано '+states.items.length+' эпизодов.');
    }catch(err){showStatus('Ошибка импорта: '+err.message);}finally{e.target.value='';}
  });
  byId('ssc-clear').addEventListener('click',()=>{
    if(!states.id)return;
    if(!confirm('Удалить сохранённую хронологию персонажа #'+states.id+' только в этом браузере?'))return;
    try{localStorage.removeItem(storageKey(states.id));}catch(e){}
    states.items=[];render();showStatus('Локальные данные очищены.');
  });
  let dragging=null;
  byId('ssc-board').addEventListener('dragstart',e=>{
    const el=e.target.closest('.ssc-card');if(!el)return;dragging=el.dataset.id;el.classList.add('ssc-moving');
    if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragging);}
  });
  byId('ssc-board').addEventListener('dragend',()=>{dragging=null;select(byId('ssc-board'),'.ssc-moving,.ssc-over').forEach(x=>x.classList.remove('ssc-moving','ssc-over'));});
  byId('ssc-board').addEventListener('dragover',e=>{const col=e.target.closest('.ssc-column');if(!col)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move';col.classList.add('ssc-over');});
  byId('ssc-board').addEventListener('dragleave',e=>{const col=e.target.closest('.ssc-column');if(col&&!col.contains(e.relatedTarget))col.classList.remove('ssc-over');});
  byId('ssc-board').addEventListener('drop',e=>{
    const col=e.target.closest('.ssc-column');if(!col)return;e.preventDefault();
    const id=dragging||e.dataTransfer?.getData('text/plain');const item=states.items.find(x=>x.id===id);
    if(item){item.view=col.dataset.view;item.override={...item.override,view:true};item.viewUncertain=false;save();render();showStatus('Эпизод перенесён в «'+VIEW[item.view]+'».');}dragging=null;
  });
  byId('ssc-board').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)edit(b.dataset.edit);});
  byId('ssc-board').addEventListener('change',e=>{
    const el=e.target.closest('select[data-field]');if(!el)return;
    const item=states.items.find(x=>x.id===el.dataset.id);if(!item)return;
    if(el.dataset.field==='status'&&STATUS[el.value]){item.status=el.value;item.override={...item.override,status:true};item.statusUncertain=false;}
    else if(el.dataset.field==='view'&&VIEW[el.value]){item.view=el.value;item.override={...item.override,view:true};item.viewUncertain=false;}
    save();render();
  });
  byId('ssc-cancel').addEventListener('click',closeEdit);
  byId('ssc-form').addEventListener('submit',e=>{
    e.preventDefault();const f=e.target;
    const next={title:normalize(f.elements.title.value),url:normalize(f.elements.url.value),date:normalize(f.elements.date.value),participants:normalize(f.elements.participants.value),notes:normalize(f.elements.notes.value),category:f.elements.category.value,view:f.elements.view.value,status:f.elements.status.value};
    if(!next.title)return;
    if(next.url&&!safeURL(next.url)){showStatus('Ссылка должна вести на safespace.rusff.me');return;}
    if(!states.id){showStatus('Сначала введите ID персонажа.');return;}
    if(editingId){const item=states.items.find(x=>x.id===editingId);if(item){Object.assign(item,next,{dateKey:dateInfo(next.date).key,dateUncertain:false,categoryUncertain:false,viewUncertain:false,statusUncertain:false});item.override={...item.override,...Object.fromEntries(Object.keys(next).map(k=>[k,true]))};}}
    else{states.items.push({id:'manual-'+Date.now(),...next,manual:true,dateKey:dateInfo(next.date).key,dateUncertain:false,categoryUncertain:false,viewUncertain:false,statusUncertain:false,override:{},sectionName:'вручную',participantsSource:'указаны вручную'});}
    closeEdit();save();render();showStatus('Изменения сохранены в браузере.');
  });
  byId('ssc-delete').addEventListener('click',()=>{
    if(!editingId||!confirm('Убрать этот эпизод из хронологии? Он останется на форуме.'))return;
    states.items=states.items.filter(x=>x.id!==editingId);closeEdit();save();render();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(byId('ssc-editor').classList.contains('is-open'))closeEdit();else if(!isTargetTopic)overlay.classList.remove('is-open');}});
  // Do not automatically scan; only fetch on an explicit click.
  const current=typeof UserID==='number'&&UserID>0?String(UserID):'';
  if(current){byId('ssc-user').value=current;restore(current);}else render();
  if(!isForum()){
    // GitHub Pages cannot read the logged-in forum: cookies and CORS are restricted.
    // Manual editing, JSON import, and beautiful HTML export do work here.
    byId('ssc-scan').disabled=true;
    byId('ssc-scan').title='Откройте Safe Space и нажмите «✦ Хронология»';
    byId('ssc-scan').textContent='Автосбор — на форуме';
    showStatus('Режим GitHub Pages: добавляйте эпизоды вручную или импортируйте JSON. Для автоматического поиска откройте Safe Space.');
    document.querySelector('main')?.appendChild(overlay);
    overlay.classList.add('is-open');
    const close=byId('ssc-close');close.style.display='none';
    overlay.style.position='relative';overlay.style.inset='auto';overlay.style.display='flex';
    overlay.style.padding='0';overlay.style.background='transparent';overlay.style.zIndex='1';
    overlay.querySelector('.ssc-shell').style.height='min(90vh,1080px)';
  }
})();
