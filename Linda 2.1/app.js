/* ============================================================
   LEARN WITH LINDA — app.js v7
   4 Modules: Direct Recognition, Intensity, Scene Match, Cross-Actor
   ============================================================ */
'use strict';

// ============================================================
// STORAGE
// ============================================================
var currentUser = null;
var useSession  = false;

function userKey(k) {
  return currentUser ? 'linda_' + currentUser.username + '_' + k : null;
}

var store = {
  _s: function () { return useSession ? sessionStorage : localStorage; },
  get: function (k) {
    var key = userKey(k); if (!key) return null;
    try { var v = this._s().getItem(key); return v ? JSON.parse(v) : null; } catch(e){ return null; }
  },
  set: function (k, v) {
    var key = userKey(k); if (!key) return;
    try { this._s().setItem(key, JSON.stringify(v)); } catch(e){}
  },
  clearUser: function () {
    if (!currentUser) return;
    var prefix = 'linda_' + currentUser.username + '_';
    var s = useSession ? sessionStorage : localStorage;
    ['progress','stats','shown'].forEach(function(k){
      try { s.removeItem(prefix + k); } catch(e){}
    });
  }
};

var GLOBAL_KEYS = { ACCOUNTS:'linda_accounts', CURRENT:'linda_current_user' };

function getAccounts() { try { var v=localStorage.getItem(GLOBAL_KEYS.ACCOUNTS); return v?JSON.parse(v):{}; } catch(e){ return {}; } }
function saveAccounts(a) { try { localStorage.setItem(GLOBAL_KEYS.ACCOUNTS, JSON.stringify(a)); } catch(e){} }
function getCurrentUser() { try { var v=localStorage.getItem(GLOBAL_KEYS.CURRENT); return v?JSON.parse(v):null; } catch(e){ return null; } }
function saveCurrentUser(u) { try { localStorage.setItem(GLOBAL_KEYS.CURRENT, JSON.stringify(u)); } catch(e){} }
function clearCurrentUser() { try { localStorage.removeItem(GLOBAL_KEYS.CURRENT); } catch(e){} }

function hashPassword(pw) {
  var h=5381; for(var i=0;i<pw.length;i++){ h=((h<<5)+h)^pw.charCodeAt(i); } return (h>>>0).toString(36);
}

// ============================================================
// EMOTION CONFIG
// ============================================================
var EMOTION_LABELS = {
  happiness:'Happy', sadness:'Sad', anger:'Angry', fear:'Fearful',
  surprise:'Surprised', disgust:'Disgust', neutral:'Neutral', calm:'Calm'
};

var EMOTION_HINTS = {
  happiness: 'Look at the mouth corners — they pull upward.',
  sadness:   'Look at the inner eyebrows — they rise toward each other.',
  anger:     'Look at the eyebrows — they are pulled low and close together.',
  fear:      'Look at the eyes — they open very wide.',
  surprise:  'Look at the eyebrows and mouth — both open wide.',
  disgust:   'Look at the nose and upper lip — they wrinkle upward.',
  neutral:   'The face is completely relaxed — no muscle is tense.',
  calm:      'The face is soft and relaxed, with gentle, steady eyes.'
};

var EMOTION_REVEAL = {
  happiness: 'The mouth corners go up. The cheeks lift. The eyes may crinkle.',
  sadness:   'The inner eyebrows rise together. The mouth corners fall.',
  anger:     'The brows press down and inward. The jaw tightens.',
  fear:      'The eyes open very wide. The eyebrows go up and together.',
  surprise:  'The eyebrows shoot up. The mouth opens. The eyes widen.',
  disgust:   'The nose wrinkles. The upper lip curls upward.',
  neutral:   'All facial muscles are at rest. No expression is active.',
  calm:      'The face is relaxed and still. Breathing looks slow and easy.'
};

var EMO_COLOR = {
  happiness:'#D4820A', sadness:'#4A7BAA', anger:'#B83030', fear:'#7A5BAB',
  surprise:'#1A8A72', disgust:'#6A8A28', neutral:'#8A7A6A', calm:'#4A8A9A'
};

var ALL_EMOTIONS    = ['happiness','sadness','anger','fear','surprise','disgust','neutral','calm'];
var STRONG_EMOTIONS = ['happiness','sadness','anger','fear','surprise','disgust','calm'];
var PASS_THRESHOLD  = 0.70;

// ============================================================
// MODULE DEFINITIONS
// ============================================================
var MODULES = [
  { id:1, title:'Direct Recognition',            subtitle:'Watch. Name the emotion.',
    icon:'▶', numQuestions:10, type:'direct' },
  { id:2, title:'Intensity',                     subtitle:'Same emotion — which is stronger?',
    icon:'◎', numQuestions:8,  type:'intensity' },
  { id:3, title:'Scene Match',                   subtitle:'Read a situation. Find the matching face.',
    icon:'⟷', numQuestions:10, type:'scene' },
  { id:4, title:'Same Emotion, Different People',subtitle:'Two people, one emotion — what is it?',
    icon:'⧖', numQuestions:8,  type:'cross' }
];

// ============================================================
// STATE
// ============================================================
var state = {
  currentModule:    null,
  currentQIndex:    0,
  currentQuestions: [],
  moduleScores:     {},
  silenceTimers:    [],
  genderPref:       'female',
  activeVideos:     []
};

// ============================================================
// HELPERS
// ============================================================
function shuffle(arr) {
  for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=arr[i];arr[i]=arr[j];arr[j]=t; }
  return arr;
}
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function pickRandomEmotion(exclude) {
  var pool=ALL_EMOTIONS.filter(function(e){ return !exclude||exclude.indexOf(e)===-1; });
  return pickRandom(pool);
}

// ============================================================
// QUESTION BUILDERS
// ============================================================
function buildDirectQuestions(gender, n) {
  var qs=[], cycle=shuffle(ALL_EMOTIONS.slice());
  for(var i=0;i<n;i++){
    var em=cycle[i%cycle.length];
    var vid=window.pickVideo(gender,em);
    if(!vid) continue; // Skip emotions that don't have videos for this gender
    var wrongs=shuffle(ALL_EMOTIONS.filter(function(e){return e!==em;})).slice(0,3);
    qs.push({ type:'direct', emotion:em, video:vid, choices:shuffle([em].concat(wrongs)), wrongCount:0 });
  }
  return shuffle(qs);
}

function buildIntensityQuestions(gender, n) {
  var qs=[], cycle=shuffle(STRONG_EMOTIONS.slice());
  for(var i=0;i<n;i++){
    var em=cycle[i%cycle.length];
    var pair=window.pickIntensityPair(gender,em); if(!pair) continue;
    var leftIsStrong=Math.random()>0.5;
    qs.push({ type:'intensity', emotion:em,
      leftVideo: leftIsStrong?pair.strong:pair.normal,
      rightVideo:leftIsStrong?pair.normal:pair.strong,
      correctSide:leftIsStrong?'left':'right', wrongCount:0 });
  }
  return shuffle(qs);
}

function buildSceneQuestions(gender, n) {
  var qs=[], scenarios=window.UNI_SCENARIOS||{}, cycle=shuffle(ALL_EMOTIONS.slice());
  for(var i=0;i<n;i++){
    var em=cycle[i%cycle.length];
    var pool=scenarios[em]||[]; if(!pool.length) continue;
    var scenario=pickRandom(pool);
    var correctVid=window.pickVideo(gender,em); if(!correctVid) continue;
    var wrongEm=pickRandomEmotion([em]);
    var wrongVid=window.pickVideo(gender,wrongEm); if(!wrongVid) continue;
    var leftIsCorrect=Math.random()>0.5;
    qs.push({ type:'scene', emotion:em, scenario:scenario,
      leftVideo: leftIsCorrect?correctVid:wrongVid,
      rightVideo:leftIsCorrect?wrongVid:correctVid,
      correctSide:leftIsCorrect?'left':'right', wrongCount:0 });
  }
  return shuffle(qs);
}

function buildCrossQuestions(n) {
  var qs=[], cycle=shuffle(ALL_EMOTIONS.slice());
  for(var i=0;i<n;i++){
    var em=cycle[i%cycle.length];
    var fv=window.pickVideo('female',em), mv=window.pickVideo('male',em);
    if(!fv||!mv) continue; // Skip emotions that don't have videos for both genders
    var leftIsFemale=Math.random()>0.5;
    var wrongs=shuffle(ALL_EMOTIONS.filter(function(e){return e!==em;})).slice(0,3);
    qs.push({ type:'cross', emotion:em,
      leftVideo: leftIsFemale?fv:mv, rightVideo:leftIsFemale?mv:fv,
      choices:   shuffle([em].concat(wrongs)), wrongCount:0 });
  }
  return shuffle(qs);
}

function buildModuleQuestions(mod) {
  var g = state.genderPref==='both' ? (Math.random()>0.5?'female':'male') : state.genderPref;
  switch(mod.type){
    case 'direct':    return buildDirectQuestions(g, mod.numQuestions);
    case 'intensity': return buildIntensityQuestions(g, mod.numQuestions);
    case 'scene':     return buildSceneQuestions(g, mod.numQuestions);
    case 'cross':     return buildCrossQuestions(mod.numQuestions);
    default:          return [];
  }
}

// ============================================================
// SCREENS
// ============================================================
var SCREEN_IDS = ['auth','consent','tutorial','home','quiz','result','stats','rule','settings'];

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

function showRuleBox(origin){
  state.ruleReturnScreen = origin || 'home';
  clearST();
  showScreen('rule');
}

function closeRuleBox(){
  var target = state.ruleReturnScreen || 'home';
  if(target === 'quiz'){
    showScreen('quiz');
    startST();
  } else if(target === 'stats'){
    showStats();
  } else {
    showHome();
  }
}

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
  v.className=cls||'quiz-video'; v.src=entry.path; v.loop=true; v.muted=true; v.playsInline=true;
  v.setAttribute('aria-label','Video clip');
  v.addEventListener('click',function(){ if(v.paused) v.play(); else v.pause(); });
  state.activeVideos.push(v);
  return v;
}

function playAll(){ state.activeVideos.forEach(function(v){ v.play().catch(function(){}); }); }

// ============================================================
// AUTH
// ============================================================
function switchAuthTab(tab){
  document.getElementById('tab-login').classList.toggle('active',  tab==='login');
  document.getElementById('tab-signup').classList.toggle('active', tab==='signup');
  document.getElementById('form-login').classList.toggle('hidden',  tab!=='login');
  document.getElementById('form-signup').classList.toggle('hidden', tab!=='signup');
  clearAuthErrors();
}
window.switchAuthTab=switchAuthTab;

function clearAuthErrors(){
  ['login-error','signup-error'].forEach(function(id){
    var el=document.getElementById(id); if(el){ el.textContent=''; el.classList.remove('visible'); }
  });
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
  if(account.tutorialDone) showHome(); else startTutorial();
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
  accounts[username]={ passwordHash:hashPassword(password), name:name, consent:false, tutorialDone:false };
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
  startTutorial();
});
document.getElementById('btn-consent-no').addEventListener('click',function(){ useSession=true; startTutorial(); });

// ============================================================
// TUTORIAL
// ============================================================
var TUT_SLIDES=[
  'You will watch short video clips of real people.',
  'Your task is to identify the emotion — or match it to a situation.',
  'There are four types of exercises. Each one trains a different skill.',
  'You can stop at any time. Your progress is saved.'
];
var tutIdx=0;

function startTutorial(){ tutIdx=0; showScreen('tutorial'); renderTutSlide(); }

function renderTutSlide(){
  var c=document.getElementById('tutorial-container'); if(!c) return;
  var isLast=tutIdx===TUT_SLIDES.length-1;
  var dots=''; for(var d=0;d<TUT_SLIDES.length;d++) dots+='<span class="reg-dot'+(d===tutIdx?' active':'')+'"></span>';
  c.innerHTML='<div class="reg-dots">'+dots+'</div><p class="tutorial-text">'+TUT_SLIDES[tutIdx]+'</p>'+
    '<div class="btn-stack">'+(isLast?'<button class="btn-primary" id="btn-tut-r">I am ready</button>':'<button class="btn-primary" id="btn-tut-n">Next</button>')+
    '<button class="btn-outline" id="btn-tut-s">Skip</button></div>';
  var n=document.getElementById('btn-tut-n'), r=document.getElementById('btn-tut-r'), s=document.getElementById('btn-tut-s');
  if(n) n.addEventListener('click',function(){ tutIdx++; renderTutSlide(); });
  if(r) r.addEventListener('click',finishTutorial);
  if(s) s.addEventListener('click',finishTutorial);
}

function finishTutorial(){
  var a=getAccounts(); if(currentUser&&a[currentUser.username]){ a[currentUser.username].tutorialDone=true; saveAccounts(a); }
  showHome();
}

// ============================================================
// HOME
// ============================================================
function showHome(){
  showScreen('home');
  var name=currentUser&&currentUser.name?currentUser.name:'there';
  document.getElementById('home-greeting').textContent='Hi '+name+'. 👋';
  renderModuleCards();
}

function renderModuleCards(){
  var progress=store.get('progress')||{completedModules:[],scores:{}};
  var completed=progress.completedModules||[], scores=progress.scores||{};
  var c=document.getElementById('module-cards'); if(!c) return;
  c.innerHTML='';
  MODULES.forEach(function(mod,i){
    var isDone=completed.indexOf(mod.id)!==-1;
    var isLocked=i>0&&completed.indexOf(MODULES[i-1].id)===-1;
    var sc=scores[mod.id];
    var cls=isDone?'completed':isLocked?'locked':'unlocked';
    var badge=isDone?'✓':isLocked?'🔒':mod.icon;
    var sub=mod.subtitle; if(sc) sub+=' · '+sc.correct+'/'+sc.total;
    var card=document.createElement('div');
    card.className='level-card '+cls;
    card.setAttribute('role','button'); card.setAttribute('tabindex',isLocked?'-1':'0');
    card.innerHTML='<div><div class="level-card-title">Module '+mod.id+': '+mod.title+'</div><div class="level-card-sub">'+sub+'</div></div><div class="level-card-badge">'+badge+'</div>';
    if(!isLocked){
      card.addEventListener('click',function(){ startModule(mod.id); });
      card.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' ') startModule(mod.id); });
    }
    c.appendChild(card);
  });
}

document.getElementById('btn-settings').addEventListener('click',showSettings);
document.getElementById('btn-stats-home').addEventListener('click',showStats);

// ============================================================
// QUIZ — start
// ============================================================
function startModule(moduleId){
  var mod=MODULES.find(function(m){ return m.id===moduleId; }); if(!mod) return;
  state.currentModule=mod;
  showGenderSelection(mod);
}

function showGenderSelection(mod){
  // Show different options based on module
  var femaleBtn = document.getElementById('btn-actor-female');
  var maleBtn = document.getElementById('btn-actor-male');
  var bothBtn = document.getElementById('btn-actor-both');
  var backBtn = document.getElementById('btn-actor-back');

  // Show/hide "Both" option based on module
  bothBtn.style.display = (mod.id === 4) ? 'block' : 'none';

  // Clear previous event listeners
  var newFemaleBtn = femaleBtn.cloneNode(true);
  var newMaleBtn = maleBtn.cloneNode(true);
  var newBothBtn = bothBtn.cloneNode(true);
  var newBackBtn = backBtn.cloneNode(true);

  femaleBtn.parentNode.replaceChild(newFemaleBtn, femaleBtn);
  maleBtn.parentNode.replaceChild(newMaleBtn, maleBtn);
  bothBtn.parentNode.replaceChild(newBothBtn, bothBtn);
  backBtn.parentNode.replaceChild(newBackBtn, backBtn);

  // Add event listeners
  newFemaleBtn.addEventListener('click', function(){
    state.genderPref = 'female';
    store.set('genderPref', 'female');
    hideOverlay('overlay-actor');
    proceedWithModule();
  });

  newMaleBtn.addEventListener('click', function(){
    state.genderPref = 'male';
    store.set('genderPref', 'male');
    hideOverlay('overlay-actor');
    proceedWithModule();
  });

  newBothBtn.addEventListener('click', function(){
    state.genderPref = 'both';
    store.set('genderPref', 'both');
    hideOverlay('overlay-actor');
    proceedWithModule();
  });

  newBackBtn.addEventListener('click', function(){
    hideOverlay('overlay-actor');
    showHome();
  });

  showOverlay('overlay-actor');
}

function proceedWithModule(){
  var mod = state.currentModule;
  state.currentQIndex = 0;
  state.moduleScores = {};
  state.currentQuestions = buildModuleQuestions(mod);
  showScreen('quiz');
  document.getElementById('quiz-level-name').textContent = 'Module ' + mod.id + ': ' + mod.title;
  loadQuestion();
}

// ============================================================
// QUIZ — load question
// ============================================================
function loadQuestion(){
  stopAllVideos();
  var q=state.currentQuestions[state.currentQIndex];
  if(!q){ finishModule(); return; }
  var total=state.currentQuestions.length;
  document.getElementById('quiz-progress-text').textContent=(state.currentQIndex+1)+' / '+total;
  hideIC(); hideFeedback(); clearST();
  switch(q.type){
    case 'direct':    renderDirect(q);    break;
    case 'intensity': renderIntensity(q); break;
    case 'scene':     renderScene(q);     break;
    case 'cross':     renderCross(q);     break;
  }
  startST();
}

// -------- DIRECT --------
function renderDirect(q){
  var wrap=document.getElementById('quiz-video-area'); wrap.innerHTML='';
  var vEl=makeVideoEl(q.video,'quiz-video single');
  var vWrap=document.createElement('div'); vWrap.className='single-video-wrap';
  vWrap.appendChild(vEl); wrap.appendChild(vWrap);
  addPlayBtn(vWrap, function(){ vEl.play(); });
  document.getElementById('quiz-scenario').textContent='What emotion is this?';
  document.getElementById('quiz-scenario-wrap').classList.remove('hidden');
  renderChoiceButtons(q.choices,function(chosen){ onSingleAnswer(chosen,q.emotion); });
}

// -------- INTENSITY --------
function renderIntensity(q){
  renderDualVideo(q,
    'Both clips show the same emotion.\nWhich is more strongly?',
    'This one','This one');
}

// -------- SCENE --------
function renderScene(q){
  renderDualVideo(q, q.scenario, 'This person','This person');
}

// -------- CROSS --------
function renderCross(q){
  var wrap=document.getElementById('quiz-video-area'); wrap.innerHTML='';
  var lEl=makeVideoEl(q.leftVideo,'quiz-video dual'), rEl=makeVideoEl(q.rightVideo,'quiz-video dual');
  var dual=makeDualWrap(lEl,rEl,null,null);
  wrap.appendChild(dual);
  addPlayAllBtn(wrap);
  document.getElementById('quiz-scenario').textContent='Both people are expressing the same emotion. What is it?';
  document.getElementById('quiz-scenario-wrap').classList.remove('hidden');
  renderChoiceButtons(q.choices,function(chosen){ onSingleAnswer(chosen,q.emotion); });
}

function renderDualVideo(q, scenarioText, lLabel, rLabel){
  var wrap=document.getElementById('quiz-video-area'); wrap.innerHTML='';
  var lEl=makeVideoEl(q.leftVideo,'quiz-video dual'), rEl=makeVideoEl(q.rightVideo,'quiz-video dual');
  var dual=makeDualWrap(lEl,rEl,
    function(){ onSideAnswer('left',q.correctSide,q); },
    function(){ onSideAnswer('right',q.correctSide,q); },
    lLabel, rLabel);
  wrap.appendChild(dual);
  addPlayAllBtn(wrap);
  document.getElementById('quiz-scenario').textContent=scenarioText;
  document.getElementById('quiz-scenario-wrap').classList.remove('hidden');
  document.getElementById('quiz-answers').innerHTML='';
}

function makeDualWrap(lEl,rEl,lCb,rCb,lLabel,rLabel){
  var dual=document.createElement('div'); dual.className='dual-video-wrap';
  var lWrap=document.createElement('div'); lWrap.className='dual-slot'; lWrap.appendChild(lEl);
  var rWrap=document.createElement('div'); rWrap.className='dual-slot'; rWrap.appendChild(rEl);
  if(lCb){
    var lBtn=document.createElement('button'); lBtn.className='btn-side-answer'; lBtn.textContent=lLabel||'Left';
    lBtn.addEventListener('click',lCb); lWrap.appendChild(lBtn);
  }
  if(rCb){
    var rBtn=document.createElement('button'); rBtn.className='btn-side-answer'; rBtn.textContent=rLabel||'Right';
    rBtn.addEventListener('click',rCb); rWrap.appendChild(rBtn);
  }
  dual.appendChild(lWrap); dual.appendChild(rWrap);
  return dual;
}

function addPlayBtn(parent, cb){
  var btn=document.createElement('button'); btn.className='video-play-btn'; btn.textContent='▶ Play';
  btn.addEventListener('click',function(){ cb(); btn.remove(); }); parent.appendChild(btn);
}

function addPlayAllBtn(parent){
  var btn=document.createElement('button'); btn.className='video-play-all-btn'; btn.textContent='▶ Play both';
  btn.addEventListener('click',function(){ playAll(); btn.remove(); }); parent.appendChild(btn);
}

function renderChoiceButtons(choices,onChoose){
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
function onSingleAnswer(chosen,correct){
  startST();
  var q=state.currentQuestions[state.currentQIndex];
  var ok=chosen===correct;
  if(ok){
    state.moduleScores[state.currentQIndex]=ok; updateStats(correct,ok);
    disableAnswerButtons();
    document.querySelectorAll('.btn-answer').forEach(function(b){
      if(b.dataset.emotion===correct) b.classList.add('correct');
    });
    showFeedback('Correct. ✓'); animateCorrect(); setTimeout(function(){ hideFeedback(); nextQuestion(); },1600);
  } else {
    q.wrongCount++;
    disableAnswerButtons();
    document.querySelectorAll('.btn-answer').forEach(function(b){
      if(b.dataset.emotion===chosen) b.classList.add('wrong');
    });
    if(q.wrongCount === 1){
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); enableAnswerButtons(); startST(); },1600);
    } else if(q.wrongCount === 2){
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); showHintDialog(); },1600);
    } else {
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); showHint(); },1600);
    }
  }
}

function onSideAnswer(chosen,correct,q){
  startST();
  var ok=chosen===correct;
  if(ok){
    state.moduleScores[state.currentQIndex]=ok; updateStats(q.emotion,ok);
    disableSideButtons();
    document.querySelectorAll('.btn-side-answer').forEach(function(btn,idx){
      var side=idx===0?'left':'right';
      if(side===correct) btn.classList.add('side-correct');
    });
    showFeedback('Correct. ✓'); setTimeout(function(){ hideFeedback(); nextQuestion(); },1600);
  } else {
    q.wrongCount++;
    disableSideButtons();
    document.querySelectorAll('.btn-side-answer').forEach(function(btn,idx){
      var side=idx===0?'left':'right';
      if(side===chosen) btn.classList.add('side-wrong');
    });
    if(q.wrongCount === 1){
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); enableSideButtons(); startST(); },1600);
    } else if(q.wrongCount === 2){
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); showHintDialog(); },1600);
    } else {
      showFeedback('Try again.');
      setTimeout(function(){ hideFeedback(); showHint(); },1600);
    }
  }
}

function disableAnswerButtons(){ document.querySelectorAll('.btn-answer').forEach(function(b){ b.disabled=true; }); }
function disableSideButtons(){   document.querySelectorAll('.btn-side-answer').forEach(function(b){ b.disabled=true; }); }
function enableAnswerButtons(){  document.querySelectorAll('.btn-answer').forEach(function(b){ b.disabled=false; b.classList.remove('correct','wrong'); }); }
function enableSideButtons(){    document.querySelectorAll('.btn-side-answer').forEach(function(b){ b.disabled=false; b.classList.remove('side-correct','side-wrong'); }); }
function nextQuestion(){ state.currentQIndex++; loadQuestion(); }

function showFeedback(t){ var e=document.getElementById('quiz-feedback'); e.textContent=t; e.classList.remove('hidden'); }
function hideFeedback(){  document.getElementById('quiz-feedback').classList.add('hidden'); }
function animateCorrect(){ state.activeVideos.forEach(function(v){ v.classList.add('glow'); setTimeout(function(){ v.classList.remove('glow'); },700); }); }

function showReveal(correct){
  var color=EMO_COLOR[correct]||'#666';
  showIC('card-reveal',
    '<p class="ic-label">The answer is</p>'+
    '<p class="ic-emotion" style="color:'+color+'">'+EMOTION_LABELS[correct]+'</p>'+
    '<p class="ic-desc">'+EMOTION_REVEAL[correct]+'</p>'+
    '<p class="ic-label" style="margin-top:14px">Hint:</p>'+
    '<p class="ic-desc" style="font-style:italic;margin-top:4px">'+EMOTION_HINTS[correct]+'</p>'+
    '<button class="ic-btn-full" id="ic-ct" style="margin-top:14px">Continue</button>');
  document.getElementById('ic-ct').addEventListener('click',function(){ hideIC(); nextQuestion(); });
}

function showRevealSide(correctSide,q){
  var color=EMO_COLOR[q.emotion]||'#666';
  var side=correctSide==='left'?'the left video':'the right video';
  showIC('card-reveal',
    '<p class="ic-label">The stronger expression was in '+side+'</p>'+
    '<p class="ic-emotion" style="color:'+color+'">'+EMOTION_LABELS[q.emotion]+'</p>'+
    '<p class="ic-desc">'+EMOTION_REVEAL[q.emotion]+'</p>'+
    '<button class="ic-btn-full" id="ic-ct">Continue</button>');
  document.getElementById('ic-ct').addEventListener('click',function(){ hideIC(); nextQuestion(); });
}

// ============================================================
// HINT
// ============================================================
document.getElementById('btn-hint-link').addEventListener('click',function(){ startST(); showHint(); });

function showHint(){
  var q=state.currentQuestions[state.currentQIndex], em=q&&q.emotion;
  showIC('card-hint',
    '<p class="ic-label">Hint</p>'+
    '<p class="ic-body">'+(em?EMOTION_HINTS[em]:'Look at the whole face carefully.')+'</p>'+
    '<button class="ic-btn-full" id="ic-bk">Back to question</button>');
  document.getElementById('ic-bk').addEventListener('click',function(){
    hideIC();
    q.wrongCount = 2; // Reset to 2 so they get one more try before hint again
    if(q.type==='direct'||q.type==='cross'){ enableAnswerButtons(); }
    else { enableSideButtons(); }
    startST();
  });
}

function showHintDialog(){
  showIC('card-silence','<p class="ic-body">Need a hint?</p><div class="ic-btns"><button class="btn-outline" id="ic-y" style="flex:1">Yes</button><button class="btn-outline" id="ic-n" style="flex:1">No</button></div>');
  document.getElementById('ic-y').addEventListener('click',function(){ hideIC(); showHint(); });
  document.getElementById('ic-n').addEventListener('click',function(){
    hideIC();
    var q=state.currentQuestions[state.currentQIndex];
    q.wrongCount = 2; // Reset to 2 so they get one more try before hint again
    if(q.type==='direct'||q.type==='cross'){ enableAnswerButtons(); }
    else { enableSideButtons(); }
    startST();
  });
}

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
    showIC('card-silence','<p class="ic-body">Would you like a hint?</p><div class="ic-btns"><button class="btn-outline" id="ic-y" style="flex:1">Yes</button><button class="btn-outline" id="ic-n" style="flex:1">No</button></div>');
    document.getElementById('ic-y').addEventListener('click',function(){ hideIC(); showHint(); });
    document.getElementById('ic-n').addEventListener('click',function(){ hideIC(); startST(); });
  },60000));
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return;
    showIC('card-silence','<p class="ic-body">Do you want to continue?</p><div class="ic-btns"><button class="btn-outline" id="ic-y" style="flex:1">Yes</button><button class="btn-outline" id="ic-n" style="flex:1">No</button></div>');
    document.getElementById('ic-y').addEventListener('click',function(){ hideIC(); startST(); });
    document.getElementById('ic-n').addEventListener('click',function(){ hideIC(); showGoodbye(); });
  },120000));
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return; clearST();
    showIC('card-silence','<p class="ic-body">You did good today. Have a nice day. 👋</p>');
    setTimeout(function(){ hideIC(); showHome(); },3000);
  },150000));
}
document.addEventListener('click',function(){ var q=document.getElementById('screen-quiz'); if(q&&!q.classList.contains('hidden')) startST(); });

// ============================================================
// FINISH MODULE
// ============================================================
function finishModule(){
  clearST();
  var mod=state.currentModule, total=state.currentQuestions.length, correct=0;
  Object.values(state.moduleScores).forEach(function(v){ if(v===true) correct++; });
  var pct=total>0?correct/total:0, passed=pct>=PASS_THRESHOLD;

  var progress=store.get('progress')||{completedModules:[],scores:{}};
  if(!progress.completedModules) progress.completedModules=[];
  if(!progress.scores) progress.scores={};
  progress.scores[mod.id]={correct:correct,total:total};
  if(passed&&progress.completedModules.indexOf(mod.id)===-1) progress.completedModules.push(mod.id);
  store.set('progress',progress);

  var acc=(store.get('stats')||{}).emotionAccuracy||{};
  var strongest=null,weakest=null,hi=-1,lo=2;
  ALL_EMOTIONS.forEach(function(em){ var d=acc[em]; if(d&&d.total>0){ var r=d.correct/d.total; if(r>hi){hi=r;strongest=em;} if(r<lo){lo=r;weakest=em;} } });

  document.getElementById('result-score').textContent='You got '+correct+' out of '+total+' correct.';
  if(passed){
    document.getElementById('result-title').textContent='Module complete. ✓';
    document.getElementById('result-message').textContent='';
    document.getElementById('btn-next-level').textContent='Next module';
    document.getElementById('btn-next-level').style.display='';
    document.getElementById('btn-try-again').style.display='none';
  } else {
    document.getElementById('result-title').textContent='Module finished.';
    document.getElementById('result-message').textContent='You need 70% to unlock the next module. Try again to improve.';
    document.getElementById('btn-next-level').textContent='Continue anyway';
    document.getElementById('btn-next-level').style.display='';
    document.getElementById('btn-try-again').style.display='';
  }
  document.getElementById('result-strongest').textContent=strongest?'Strongest: '+EMOTION_LABELS[strongest]:'';
  document.getElementById('result-weakest').textContent=(weakest&&weakest!==strongest)?'Needs practice: '+EMOTION_LABELS[weakest]:'';
  showScreen('result');
}

document.getElementById('btn-next-level').addEventListener('click',function(){
  var progress=store.get('progress')||{completedModules:[],scores:{}};
  if(!progress.completedModules) progress.completedModules=[];
  var mid=state.currentModule?state.currentModule.id:0;
  if(progress.completedModules.indexOf(mid)===-1) progress.completedModules.push(mid);
  store.set('progress',progress);
  var next=MODULES.find(function(m){ return m.id===mid+1; });
  if(next) startModule(next.id); else showHome();
});
document.getElementById('btn-try-again').addEventListener('click',function(){ if(state.currentModule) startModule(state.currentModule.id); else showHome(); });
document.getElementById('btn-result-home').addEventListener('click',function(){ document.getElementById('btn-next-level').textContent='Next module'; showHome(); });

// ============================================================
// STATS
// ============================================================
var EMO_BAR={ happiness:'#D4820A',sadness:'#4A7BAA',anger:'#B83030',fear:'#7A5BAB',surprise:'#1A8A72',disgust:'#6A8A28',neutral:'#8A7A6A',calm:'#4A8A9A' };

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
document.getElementById('btn-rule-home').addEventListener('click',function(){ showRuleBox('home'); });
document.getElementById('btn-rule-quiz').addEventListener('click',function(){ showRuleBox('quiz'); });
document.getElementById('btn-rule-back').addEventListener('click',closeRuleBox);

// ============================================================
// SETTINGS
// ============================================================
function showSettings(){
  showScreen('settings');
  document.getElementById('settings-user-name').textContent=currentUser&&currentUser.name?currentUser.name:'Unknown';
  document.getElementById('settings-user-sub').textContent=currentUser&&currentUser.username?'@'+currentUser.username:'';
}
document.getElementById('btn-replay-tutorial').addEventListener('click',startTutorial);
document.getElementById('btn-account-quit').addEventListener('click',function(){
  showConfirm('Log out of your account?',function(){ clearST(); currentUser=null; clearCurrentUser(); useSession=false; showAuth(); },function(){});
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
function init(){
  if(!Array.prototype.find){ Array.prototype.find=function(cb){ for(var i=0;i<this.length;i++) if(cb(this[i],i,this)) return this[i]; }; }
  if(!Object.values){ Object.values=function(o){ return Object.keys(o).map(function(k){ return o[k]; }); }; }
  var savedGender=store.get('genderPref'); if(savedGender) state.genderPref=savedGender;
  var saved=getCurrentUser();
  if(saved&&saved.username){
    var accounts=getAccounts(), account=accounts[saved.username];
    if(account){ currentUser=saved; useSession=!account.consent; if(account.tutorialDone){ showHome(); return; } else { startTutorial(); return; } }
  }
  showAuth();
}
document.addEventListener('DOMContentLoaded',init);
