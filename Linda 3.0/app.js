/* ============================================================
   LEARN WITH LINDA — app.js
   3 Levels | alternating gender | unique actors | buttons after video
   ============================================================ */
'use strict';

// ============================================================
// STORAGE
// ============================================================
var currentUser = null;
var useSession  = false;

function userKey(k) { return currentUser ? 'linda_' + currentUser.username + '_' + k : null; }

var store = {
  _s: function(){ return useSession ? sessionStorage : localStorage; },
  get: function(k){ var key=userKey(k); if(!key) return null; try{ var v=this._s().getItem(key); return v?JSON.parse(v):null; }catch(e){ return null; } },
  set: function(k,v){ var key=userKey(k); if(!key) return; try{ this._s().setItem(key,JSON.stringify(v)); }catch(e){} },
  clearUser: function(){
    if(!currentUser) return;
    var prefix='linda_'+currentUser.username+'_', s=useSession?sessionStorage:localStorage;
    ['progress','stats'].forEach(function(k){ try{ s.removeItem(prefix+k); }catch(e){} });
  }
};

var GLOBAL_KEYS = { ACCOUNTS:'linda_accounts', CURRENT:'linda_current_user' };
function getAccounts(){ try{ var v=localStorage.getItem(GLOBAL_KEYS.ACCOUNTS); return v?JSON.parse(v):{}; }catch(e){ return {}; } }
function saveAccounts(a){ try{ localStorage.setItem(GLOBAL_KEYS.ACCOUNTS,JSON.stringify(a)); }catch(e){} }
function getCurrentUser(){ try{ var v=localStorage.getItem(GLOBAL_KEYS.CURRENT); return v?JSON.parse(v):null; }catch(e){ return null; } }
function saveCurrentUser(u){ try{ localStorage.setItem(GLOBAL_KEYS.CURRENT,JSON.stringify(u)); }catch(e){} }
function clearCurrentUser(){ try{ localStorage.removeItem(GLOBAL_KEYS.CURRENT); }catch(e){} }
function hashPassword(pw){ var h=5381; for(var i=0;i<pw.length;i++){ h=((h<<5)+h)^pw.charCodeAt(i); } return (h>>>0).toString(36); }

// ============================================================
// EMOTION CONFIG
// ============================================================
var EMOTION_LABELS = {
  happiness:'Happy', sadness:'Sad', anger:'Angry', fear:'Fearful',
  surprise:'Surprised', disgust:'Disgusted', neutral:'Neutral'
};


var EMO_COLOR = {
  happiness:'#D4820A', sadness:'#4A7BAA', anger:'#B83030', fear:'#7A5BAB',
  surprise:'#1A8A72', disgust:'#6A8A28', neutral:'#8A7A6A'
};

var ALL_EMOTIONS    = ['happiness','sadness','anger','fear','surprise','disgust','neutral'];
var PASS_THRESHOLD  = 0.70;

// ============================================================
// LEVEL DEFINITIONS
// ============================================================
var LEVELS = [
  { id:1, title:'Direct Recognition',            subtitle:'Watch. Name the emotion.',
    icon:'▶', numQuestions:10, type:'direct', choices:4 },
  { id:2, title:'Recognition Challenge',          subtitle:'More options — name the emotion.',
    icon:'◎', numQuestions:15, type:'direct', choices:7 },
  { id:3, title:'Same Emotion, Different People', subtitle:'Two people, one emotion — what is it?',
    icon:'⧖', numQuestions:20, type:'cross' }
];

// ============================================================
// STATE
// ============================================================
var state = {
  currentLevel:     null,
  currentQIndex:    0,
  currentQuestions: [],
  levelScores:      {},
  silenceTimers:    [],
  activeVideos:     []
};

// Actor pools — shuffled list, cycles through all before repeating
var actorPool = {
  female: [], fIdx: 0,
  male:   [], mIdx: 0
};

function initActorPools() {
  var f = [], m = [];
  for (var n = 1; n <= 24; n++) {
    var aid = n < 10 ? '0' + n : '' + n;
    if (n <= 12) f.push(aid); else m.push(aid);
  }
  actorPool.female = shuffle(f);
  actorPool.male   = shuffle(m);
  actorPool.fIdx   = 0;
  actorPool.mIdx   = 0;
}

function nextActor(gender) {
  if (gender === 'female') {
    if (actorPool.fIdx >= actorPool.female.length) { actorPool.female = shuffle(actorPool.female.slice()); actorPool.fIdx = 0; }
    return actorPool.female[actorPool.fIdx++];
  } else {
    if (actorPool.mIdx >= actorPool.male.length) { actorPool.male = shuffle(actorPool.male.slice()); actorPool.mIdx = 0; }
    return actorPool.male[actorPool.mIdx++];
  }
}

// ============================================================
// HELPERS
// ============================================================
function shuffle(arr) {
  for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=arr[i];arr[i]=arr[j];arr[j]=t; }
  return arr;
}
function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Pick scenario avoiding repeats within a level session
function pickUniqueScenario(em, used) {
  if (!used[em]) used[em] = [];
  var pool = (window.UNI_SCENARIOS[em] || []).filter(function(s){ return used[em].indexOf(s) === -1; });
  if (!pool.length) { used[em] = []; pool = window.UNI_SCENARIOS[em] || ['Watch closely.']; }
  var s = pickRandom(pool);
  used[em].push(s);
  return s;
}

// ============================================================
// QUESTION BUILDERS
// ============================================================
function buildDirectQuestions(n, numChoices) {
  initActorPools();
  var qs = [], emotionBag = [], usedScen = {};
  function nextEmotion() {
    if (!emotionBag.length) emotionBag = shuffle(ALL_EMOTIONS.slice());
    return emotionBag.shift();
  }
  for (var i = 0; i < n; i++) {
    var gender  = (i % 2 === 0) ? 'female' : 'male';   // strict alternating
    var em      = nextEmotion();
    var actorId = nextActor(gender);
    var vid     = window.pickVideoForActor(actorId, em);
    // fallback: try another actor of same gender
    if (!vid) { actorId = nextActor(gender); vid = window.pickVideoForActor(actorId, em); }
    if (!vid) continue;
    var wrongs   = shuffle(ALL_EMOTIONS.filter(function(e){ return e !== em; })).slice(0, numChoices - 1);
    var scenario = pickUniqueScenario(em, usedScen);
    qs.push({ type:'direct', emotion:em, video:vid, choices:shuffle([em].concat(wrongs)), scenario:scenario, });
  }
  return qs; // NOT shuffled — preserves gender alternation
}

function buildCrossQuestions(n) {
  initActorPools();
  var qs = [], emotionBag = [], usedScen = {};
  function nextEmotion() {
    if (!emotionBag.length) emotionBag = shuffle(ALL_EMOTIONS.slice());
    return emotionBag.shift();
  }
  for (var i = 0; i < n; i++) {
    var em        = nextEmotion();
    var fActorId  = nextActor('female');
    var mActorId  = nextActor('male');
    var fv        = window.pickVideoForActor(fActorId, em);
    var mv        = window.pickVideoForActor(mActorId, em);
    if (!fv || !mv) continue;
    var leftIsFemale = Math.random() > 0.5;
    var wrongs   = shuffle(ALL_EMOTIONS.filter(function(e){ return e !== em; })).slice(0, 6);
    var scenario = pickUniqueScenario(em, usedScen);
    qs.push({ type:'cross', emotion:em,
      leftVideo:  leftIsFemale ? fv : mv,
      rightVideo: leftIsFemale ? mv : fv,
      choices:    shuffle([em].concat(wrongs)), scenario:scenario, });
  }
  return qs;
}

function buildLevelQuestions(lev) {
  switch(lev.type) {
    case 'direct': return buildDirectQuestions(lev.numQuestions, lev.choices);
    case 'cross':  return buildCrossQuestions(lev.numQuestions);
    default:       return [];
  }
}

// ============================================================
// SCREENS
// ============================================================
var SCREEN_IDS = ['auth','consent','home','quiz','result','stats','settings'];

function showScreen(name) {
  stopAllVideos();
  SCREEN_IDS.forEach(function(id){
    var el=document.getElementById('screen-'+id); if(!el) return;
    if(id===name){
      el.classList.remove('hidden');
      var inner=el.querySelector('.screen-inner');
      if(inner){ inner.style.animation='none'; void inner.offsetWidth; inner.style.animation=''; }
    } else { el.classList.add('hidden'); }
  });
}

function showOverlay(id){ var el=document.getElementById(id); if(el) el.classList.remove('hidden'); }
function hideOverlay(id){ var el=document.getElementById(id); if(el) el.classList.add('hidden'); }

function showConfirm(text,onYes,onNo){
  document.getElementById('confirm-text').textContent=text;
  showOverlay('overlay-confirm');
  var yes=document.getElementById('btn-confirm-yes'), no=document.getElementById('btn-confirm-no');
  var yn=yes.cloneNode(true); yes.parentNode.replaceChild(yn,yes);
  var nn=no.cloneNode(true);  no.parentNode.replaceChild(nn,no);
  yn.addEventListener('click',function(){ hideOverlay('overlay-confirm'); if(onYes) onYes(); });
  nn.addEventListener('click',function(){ hideOverlay('overlay-confirm'); if(onNo)  onNo();  });
}

// ============================================================
// VIDEO
// ============================================================
function stopAllVideos(){
  state.activeVideos.forEach(function(v){ try{ v.pause(); v.currentTime=0; }catch(e){} });
  state.activeVideos=[];
}

function makeVideoEl(entry, cls){
  if(!entry) return null;
  var v=document.createElement('video');
  v.className=cls||'quiz-video'; v.src=entry.path; v.loop=false; v.muted=false; v.playsInline=true;
  v.setAttribute('aria-label','Video clip');
  state.activeVideos.push(v);
  return v;
}

function makeReplayBtn(videoEl, label) {
  var btn=document.createElement('button');
  btn.className='btn-replay';
  btn.textContent='↺'+(label?' '+label:'');
  btn.setAttribute('aria-label','Replay video');
  btn.addEventListener('click',function(){ videoEl.currentTime=0; videoEl.play().catch(function(){}); });
  return btn;
}

// ============================================================
// AUTH
// ============================================================
function switchAuthTab(tab){
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-signup').classList.toggle('active', tab==='signup');
  document.getElementById('form-login').classList.toggle('hidden', tab!=='login');
  document.getElementById('form-signup').classList.toggle('hidden', tab!=='signup');
  clearAuthErrors();
}
window.switchAuthTab=switchAuthTab;

function clearAuthErrors(){
  ['login-error','signup-error'].forEach(function(id){ var el=document.getElementById(id); if(el){ el.textContent=''; el.classList.remove('visible'); } });
}
function showAuthError(id,msg){ var el=document.getElementById(id); if(el){ el.textContent=msg; el.classList.add('visible'); } }

document.getElementById('btn-login').addEventListener('click',function(){
  var username=document.getElementById('login-username').value.trim().toLowerCase();
  var password=document.getElementById('login-password').value;
  clearAuthErrors();
  if(!username||!password){ showAuthError('login-error','Please fill in all fields.'); return; }
  var accounts=getAccounts(), account=accounts[username];
  if(!account){ showAuthError('login-error','Username not found.'); return; }
  if(account.passwordHash!==hashPassword(password)){ showAuthError('login-error','Incorrect password.'); return; }
  currentUser={ username:username, name:account.name };
  useSession=!account.consent; saveCurrentUser(currentUser);
  showHome();
});

['login-username','login-password'].forEach(function(id){
  document.getElementById(id).addEventListener('keydown',function(e){ if(e.key==='Enter') document.getElementById('btn-login').click(); });
});

document.getElementById('btn-signup').addEventListener('click',function(){
  var name=document.getElementById('signup-name').value.trim();
  var username=document.getElementById('signup-username').value.trim().toLowerCase();
  var password=document.getElementById('signup-password').value;
  clearAuthErrors();
  if(!name||!username||!password){ showAuthError('signup-error','Please fill in all fields.'); return; }
  if(username.length<3){ showAuthError('signup-error','Username must be at least 3 characters.'); return; }
  if(password.length<4){ showAuthError('signup-error','Password must be at least 4 characters.'); return; }
  if(/\s/.test(username)){ showAuthError('signup-error','Username cannot contain spaces.'); return; }
  var accounts=getAccounts();
  if(accounts[username]){ showAuthError('signup-error','That username is already taken.'); return; }
  accounts[username]={ passwordHash:hashPassword(password), name:name, consent:false };
  saveAccounts(accounts);
  currentUser={ username:username, name:name }; saveCurrentUser(currentUser);
  startConsent();
});

document.getElementById('signup-password').addEventListener('keydown',function(e){ if(e.key==='Enter') document.getElementById('btn-signup').click(); });

function showAuth(){
  currentUser=null; clearCurrentUser(); useSession=false;
  ['login-username','login-password','signup-name','signup-username','signup-password'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  clearAuthErrors(); switchAuthTab('login'); showScreen('auth');
}

// ============================================================
// CONSENT
// ============================================================
function startConsent(){ showScreen('consent'); }

document.getElementById('btn-consent-agree').addEventListener('click',function(){
  useSession=false;
  var a=getAccounts(); if(currentUser&&a[currentUser.username]){ a[currentUser.username].consent=true; saveAccounts(a); }
  showHome();
});
document.getElementById('btn-consent-no').addEventListener('click',function(){ useSession=true; showHome(); });

// ============================================================
// HOME
// ============================================================
function showHome(){
  showScreen('home');
  document.getElementById('home-greeting').textContent='Hi '+(currentUser&&currentUser.name?currentUser.name:'there')+'. 👋';
  renderLevelCards();
}

function renderLevelCards(){
  var progress=store.get('progress')||{completedLevels:[],scores:{}};
  var completed=progress.completedLevels||[], scores=progress.scores||{};
  var c=document.getElementById('module-cards'); if(!c) return;
  c.innerHTML='';
  LEVELS.forEach(function(lev){
    var isDone=completed.indexOf(lev.id)!==-1;
    var sc=scores[lev.id];
    var cls=isDone?'completed':'unlocked';
    var badge=isDone?'✓':lev.icon;
    var sub=lev.subtitle; if(sc) sub+=' · '+sc.correct+'/'+sc.total;
    var card=document.createElement('div');
    card.className='level-card '+cls;
    card.setAttribute('role','button'); card.setAttribute('tabindex','0');
    card.innerHTML='<div><div class="level-card-title">Level '+lev.id+': '+lev.title+'</div><div class="level-card-sub">'+sub+'</div></div><div class="level-card-badge">'+badge+'</div>';
    card.addEventListener('click',function(){ startLevel(lev.id); });
    card.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' ') startLevel(lev.id); });
    c.appendChild(card);
  });
}

document.getElementById('btn-settings').addEventListener('click',showSettings);
document.getElementById('btn-stats-home').addEventListener('click',showStats);

// ============================================================
// QUIZ — start
// ============================================================
function startLevel(levelId){
  var lev=LEVELS.find(function(l){ return l.id===levelId; }); if(!lev) return;
  state.currentLevel=lev;
  state.currentQIndex=0;
  state.levelScores={};
  state.currentQuestions=buildLevelQuestions(lev);
  showScreen('quiz');
  document.getElementById('quiz-level-name').textContent='Level '+lev.id+': '+lev.title;
  loadQuestion();
}

// ============================================================
// QUIZ — load question
// ============================================================
function loadQuestion(){
  stopAllVideos();
  var q=state.currentQuestions[state.currentQIndex];
  if(!q){ finishLevel(); return; }
  document.getElementById('quiz-progress-text').textContent=(state.currentQIndex+1)+' / '+state.currentQuestions.length;
  hideIC(); hideFeedback(); clearST();
  switch(q.type){
    case 'direct': renderDirect(q); break;
    case 'cross':  renderCross(q);  break;
  }
  startST();
}

// ============================================================
// RENDER — Level 1 & 2 (single video, buttons appear after video ends)
// ============================================================
function renderDirect(q){
  document.getElementById('quiz-scenario').textContent=q.scenario;
  document.getElementById('quiz-scenario-wrap').classList.remove('hidden');

  var wrap=document.getElementById('quiz-video-area'); wrap.innerHTML='';
  var vEl=makeVideoEl(q.video,'quiz-video single');
  var vWrap=document.createElement('div'); vWrap.className='single-video-wrap';
  vWrap.appendChild(vEl);
  vWrap.appendChild(makeReplayBtn(vEl,'Replay'));
  wrap.appendChild(vWrap);

  renderChoiceButtons(q.choices, function(chosen){ onSingleAnswer(chosen, q.emotion); });
  vEl.play().catch(function(){});
}

// ============================================================
// RENDER — Level 3 (dual video sequential, buttons after second video ends)
// ============================================================
function renderCross(q){
  document.getElementById('quiz-scenario').textContent=q.scenario;
  document.getElementById('quiz-scenario-wrap').classList.remove('hidden');

  var wrap=document.getElementById('quiz-video-area'); wrap.innerHTML='';
  var lEl=makeVideoEl(q.leftVideo,'quiz-video dual');
  var rEl=makeVideoEl(q.rightVideo,'quiz-video dual');

  var dual=document.createElement('div'); dual.className='dual-video-wrap';
  var lWrap=document.createElement('div'); lWrap.className='dual-slot';
  var rWrap=document.createElement('div'); rWrap.className='dual-slot';

  lWrap.appendChild(lEl); lWrap.appendChild(makeReplayBtn(lEl));
  rWrap.appendChild(rEl); rWrap.appendChild(makeReplayBtn(rEl));
  dual.appendChild(lWrap); dual.appendChild(rWrap);
  wrap.appendChild(dual);

  renderChoiceButtons(q.choices, function(chosen){ onSingleAnswer(chosen, q.emotion); });

  // Preload right video so it starts instantly when left ends
  rEl.preload = 'auto';
  lEl.addEventListener('ended', function(){ rEl.currentTime=0; rEl.play().catch(function(){}); });
  lEl.play().catch(function(){});
}

function renderChoiceButtons(choices, onChoose){
  var c=document.getElementById('quiz-answers'); c.innerHTML='';
  choices.forEach(function(em){
    var btn=document.createElement('button'); btn.className='btn-answer';
    btn.textContent=EMOTION_LABELS[em]||em; btn.dataset.emotion=em;
    btn.addEventListener('click',function(){ onChoose(em); }); c.appendChild(btn);
  });
}

// ============================================================
// ANSWER LOGIC
// ============================================================
function onSingleAnswer(chosen, correct){
  var q=state.currentQuestions[state.currentQIndex];
  var ok=chosen===correct;
  if(ok){
    state.levelScores[state.currentQIndex]=ok; updateStats(correct,ok);
    disableAnswerButtons();
    document.querySelectorAll('.btn-answer').forEach(function(b){ if(b.dataset.emotion===correct) b.classList.add('correct'); });
    showFeedback('Correct. ✓'); animateCorrect(); setTimeout(function(){ hideFeedback(); nextQuestion(); },1600);
  } else {
    disableAnswerButtons();
    document.querySelectorAll('.btn-answer').forEach(function(b){ if(b.dataset.emotion===chosen) b.classList.add('wrong'); });
    showFeedback('Try again.');
    setTimeout(function(){ hideFeedback(); enableAnswerButtons(); },1600);
  }
}

function disableAnswerButtons(){ document.querySelectorAll('.btn-answer').forEach(function(b){ b.disabled=true; }); }
function enableAnswerButtons(){
  document.querySelectorAll('.btn-answer').forEach(function(b){ b.disabled=false; b.classList.remove('correct','wrong'); });
}
function nextQuestion(){ state.currentQIndex++; loadQuestion(); }

function showFeedback(t){ var e=document.getElementById('quiz-feedback'); e.textContent=t; e.classList.remove('hidden'); }
function hideFeedback(){  document.getElementById('quiz-feedback').classList.add('hidden'); }
function animateCorrect(){ state.activeVideos.forEach(function(v){ v.classList.add('glow'); setTimeout(function(){ v.classList.remove('glow'); },700); }); }

// ============================================================
// QUIT
// ============================================================
document.getElementById('btn-quit').addEventListener('click',function(){
  clearST(); showConfirm('Do you want to stop?',function(){ showGoodbye(); },function(){ startST(); });
});
function showGoodbye(){ clearST(); hideIC(); showOverlay('overlay-goodbye'); }
document.getElementById('btn-goodbye-home').addEventListener('click',function(){ hideOverlay('overlay-goodbye'); hideOverlay('overlay-confirm'); showHome(); });

// ============================================================
// INLINE CARD
// ============================================================
function showIC(cls,html){ var c=document.getElementById('quiz-inline-card'); c.className='quiz-inline-card '+cls; c.innerHTML=html; }
function hideIC(){ var c=document.getElementById('quiz-inline-card'); c.className='quiz-inline-card hidden'; c.innerHTML=''; }

// ============================================================
// SILENCE PROTOCOL
// ============================================================
function clearST(){ state.silenceTimers.forEach(clearTimeout); state.silenceTimers=[]; }
function startST(){
  clearST();
  var quiz=document.getElementById('screen-quiz');
  function gone(){ return !quiz||quiz.classList.contains('hidden'); }
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return;
    showIC('card-silence','<p class="ic-body">Do you want to continue?</p><div class="ic-btns"><button class="btn-outline" id="ic-y" style="flex:1">Yes</button><button class="btn-outline" id="ic-n" style="flex:1">No</button></div>');
    document.getElementById('ic-y').addEventListener('click',function(){ hideIC(); startST(); });
    document.getElementById('ic-n').addEventListener('click',function(){ hideIC(); showGoodbye(); });
  },60000));
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return; clearST();
    showIC('card-silence','<p class="ic-body">You did good today. Have a nice day. 👋</p>');
    setTimeout(function(){ hideIC(); showHome(); },3000);
  },90000));
}
document.addEventListener('click',function(){ var q=document.getElementById('screen-quiz'); if(q&&!q.classList.contains('hidden')) startST(); });

// ============================================================
// FINISH LEVEL
// ============================================================
function finishLevel(){
  clearST();
  var lev=state.currentLevel, total=state.currentQuestions.length, correct=0;
  Object.values(state.levelScores).forEach(function(v){ if(v===true) correct++; });
  var pct=total>0?correct/total:0;

  var progress=store.get('progress')||{completedLevels:[],scores:{}};
  if(!progress.completedLevels) progress.completedLevels=[];
  if(!progress.scores) progress.scores={};
  progress.scores[lev.id]={correct:correct,total:total};
  if(pct>=PASS_THRESHOLD&&progress.completedLevels.indexOf(lev.id)===-1) progress.completedLevels.push(lev.id);
  store.set('progress',progress);

  var acc=(store.get('stats')||{}).emotionAccuracy||{};
  var strongest=null,weakest=null,hi=-1,lo=2;
  ALL_EMOTIONS.forEach(function(em){ var d=acc[em]; if(d&&d.total>0){ var r=d.correct/d.total; if(r>hi){hi=r;strongest=em;} if(r<lo){lo=r;weakest=em;} } });

  document.getElementById('result-score').textContent='You got '+correct+' out of '+total+' correct.';
  document.getElementById('result-title').textContent='Level complete. ✓';
  document.getElementById('result-message').textContent='';
  document.getElementById('btn-next-level').textContent='Next level';
  document.getElementById('btn-next-level').style.display='';
  document.getElementById('btn-try-again').style.display='none';
  document.getElementById('result-strongest').textContent=strongest?'Strongest: '+EMOTION_LABELS[strongest]:'';
  document.getElementById('result-weakest').textContent=(weakest&&weakest!==strongest)?'Needs practice: '+EMOTION_LABELS[weakest]:'';
  showScreen('result');
}

document.getElementById('btn-next-level').addEventListener('click',function(){
  var progress=store.get('progress')||{completedLevels:[],scores:{}};
  if(!progress.completedLevels) progress.completedLevels=[];
  var lid=state.currentLevel?state.currentLevel.id:0;
  if(progress.completedLevels.indexOf(lid)===-1) progress.completedLevels.push(lid);
  store.set('progress',progress);
  var next=LEVELS.find(function(l){ return l.id===lid+1; });
  if(next) startLevel(next.id); else showHome();
});
document.getElementById('btn-try-again').addEventListener('click',function(){ if(state.currentLevel) startLevel(state.currentLevel.id); else showHome(); });
document.getElementById('btn-result-home').addEventListener('click',showHome);

// ============================================================
// STATS
// ============================================================
var EMO_BAR={ happiness:'#D4820A',sadness:'#4A7BAA',anger:'#B83030',fear:'#7A5BAB',surprise:'#1A8A72',disgust:'#6A8A28',neutral:'#8A7A6A' };

function showStats(){
  showScreen('stats');
  var stats=store.get('stats')||{}, acc=stats.emotionAccuracy||{};
  var c=document.getElementById('stats-bars'); c.innerHTML='';
  ALL_EMOTIONS.forEach(function(em){
    var d=acc[em]||{correct:0,total:0}, pct=d.total>0?Math.round((d.correct/d.total)*100):0;
    var row=document.createElement('div'); row.className='stat-bar-row';
    row.innerHTML='<div class="stat-bar-label"><span>'+(EMOTION_LABELS[em]||em)+'</span><span>'+pct+'%</span></div>'+
      '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:'+pct+'%;background:'+EMO_BAR[em]+'"></div></div>';
    c.appendChild(row);
  });
  document.getElementById('stats-total').textContent='Total answered: '+(stats.totalAnswered||0);
  document.getElementById('stats-streak').textContent='Days in a row: '+(stats.streakDays||0);
}
document.getElementById('btn-stats-back').addEventListener('click',showHome);

// ============================================================
// SETTINGS
// ============================================================
function showSettings(){
  showScreen('settings');
  document.getElementById('settings-user-name').textContent=currentUser&&currentUser.name?currentUser.name:'Unknown';
  document.getElementById('settings-user-sub').textContent=currentUser&&currentUser.username?'@'+currentUser.username:'';
}
document.getElementById('btn-account-quit').addEventListener('click',function(){
  showConfirm('Log out?',function(){ clearST(); currentUser=null; clearCurrentUser(); useSession=false; showAuth(); },function(){});
});
document.getElementById('btn-delete-data').addEventListener('click',function(){
  showConfirm('Delete all your data? This cannot be undone.',function(){
    if(currentUser){ var a=getAccounts(); delete a[currentUser.username]; saveAccounts(a); store.clearUser(); }
    currentUser=null; clearCurrentUser(); useSession=false; showAuth();
  },function(){});
});
document.getElementById('btn-settings-back').addEventListener('click',showHome);

// ============================================================
// STATS TRACKING
// ============================================================
function updateStats(emotion,correct){
  var stats=store.get('stats')||{emotionAccuracy:{},totalAnswered:0,streakDays:0,lastDate:null};
  if(!stats.emotionAccuracy) stats.emotionAccuracy={};
  if(!stats.emotionAccuracy[emotion]) stats.emotionAccuracy[emotion]={correct:0,total:0};
  stats.emotionAccuracy[emotion].total++;
  if(correct) stats.emotionAccuracy[emotion].correct++;
  stats.totalAnswered=(stats.totalAnswered||0)+1;
  var today=new Date().toDateString(), yesterday=new Date(Date.now()-86400000).toDateString();
  if(stats.lastDate!==today){ stats.streakDays=(stats.lastDate===yesterday)?(stats.streakDays||0)+1:1; stats.lastDate=today; }
  store.set('stats',stats);
}

// ============================================================
// INIT
// ============================================================
(function init(){
  var saved=getCurrentUser();
  if(saved){ currentUser=saved; var a=getAccounts(); useSession=!(a[saved.username]&&a[saved.username].consent); showHome(); }
  else { showScreen('auth'); }
})();
