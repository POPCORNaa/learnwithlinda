/* ============================================================
   LEARN WITH LINDA — app.js v5
   ============================================================ */
'use strict';

// ============================================================
// STORAGE — localStorage (consent YES) or sessionStorage (consent NO)
// ============================================================
var useSession = false;

var store = {
  _s: function () { return useSession ? sessionStorage : localStorage; },
  get: function (k) { try { var v = this._s().getItem(k); return v ? JSON.parse(v) : null; } catch(e){ return null; } },
  set: function (k, v) { try { this._s().setItem(k, JSON.stringify(v)); } catch(e){} },
  clearAll: function () {
    [localStorage, sessionStorage].forEach(function(s){
      Object.values(KEYS).forEach(function(k){ try { s.removeItem(k); } catch(e){} });
    });
  }
};

var KEYS = {
  REG: 'linda_registration', CONSENT: 'linda_consent', PROGRESS: 'linda_progress',
  STATS: 'linda_stats', SHOWN: 'linda_shown_images', TUTORIAL: 'linda_tutorial_done'
};

// ============================================================
// EMOTION DATA
// ============================================================
var EMOTION_LABELS = {
  happiness:'Happy', sadness:'Sad', anger:'Angry', fear:'Fear',
  surprise:'Surprise', disgust:'Disgust', neutral:'Neutral'
};

var EMOTION_HINTS = {
  happiness: 'Look at the mouth corners. They go up.',
  sadness:   'Look at the eyebrows. The inner parts go up.',
  anger:     'Look at the eyebrows. They are low and close.',
  fear:      'Look at the eyes. They are very wide.',
  surprise:  'Look at the eyebrows. They are raised high.',
  disgust:   'Look at the nose. It is wrinkled.',
  neutral:   'The face is relaxed. No strong expression.'
};

var EMOTION_REVEAL = {
  happiness: 'The mouth corners go up. The cheeks are raised.',
  sadness:   'The inner eyebrows go up and together. The mouth corners go down.',
  anger:     'The eyebrows are low and close. The lips are pressed tight.',
  fear:      'The eyes are very wide. The eyebrows go up and together.',
  surprise:  'The eyebrows are raised high. The mouth is open.',
  disgust:   'The nose is wrinkled. The upper lip goes up.',
  neutral:   'The face is relaxed. No muscles are tense.'
};

var EMOTION_COLORS = {
  happiness:'var(--emo-happiness)', sadness:'var(--emo-sadness)', anger:'var(--emo-anger)',
  fear:'var(--emo-fear)', surprise:'var(--emo-surprise)', disgust:'var(--emo-disgust)',
  neutral:'var(--emo-neutral)'
};

var EMO_BG_HEX = {
  happiness:'#C8960C', sadness:'#2878B0', anger:'#B03030',
  fear:'#6B4BAB', surprise:'#0E8A7A', disgust:'#5A8A28', neutral:'#7A746C'
};

var ALL_EMOTIONS = ['happiness','sadness','anger','fear','surprise','disgust','neutral'];

var PASS_THRESHOLD = 0.70; // 70%

// ============================================================
// SCENARIO POOL — simple everyday situations, picked randomly
// ============================================================
var SCENARIO_POOL = {
  happiness: [
    'This person found money in their coat pocket.',
    'This person got their favourite food for lunch.',
    'This person saw a friend they have not seen for a long time.',
    'This person finished all their work early.',
    'This person heard their favourite song.',
    'This person found something they had lost.',
    'This person received a birthday card.',
    'This person\'s bus arrived on time.',
    'This person got a message from a friend.',
    'This person received a gift.',
    'This person got the last seat on the bus.',
    'The sun is shining outside.',
    'This person got a good mark on a test.',
    'This person won a board game.',
    'This person\'s favourite food was on the menu.',
    'This person found a coin on the ground.',
    'This person got a surprise visit from a friend.',
    'This person finished reading a book they liked.'
  ],
  sadness: [
    'This person\'s dog is sick.',
    'This person dropped their lunch on the floor.',
    'This person missed the bus.',
    'This person\'s favourite cup broke.',
    'It is raining and this person forgot an umbrella.',
    'This person did not get a reply to their message.',
    'This person\'s plant died.',
    'This person ate lunch alone today.',
    'This person lost something important.',
    'This person did not pass a test.',
    'This person\'s friend moved to another city.',
    'This person has nothing to do today.',
    'A friend cancelled plans without saying why.',
    'This person was not invited to an event.',
    'This person missed a person they care about.',
    'This person\'s favourite show ended.',
    'This person could not sleep last night.',
    'This person got bad news in a letter.'
  ],
  anger: [
    'Someone took this person\'s seat.',
    'Someone cut in line in front of this person.',
    'This person waited a long time and was ignored.',
    'Someone ate this person\'s food from the fridge.',
    'This person had to say the same thing three times.',
    'Someone was very loud next to this person.',
    'This person\'s order was wrong.',
    'The bus was 20 minutes late.',
    'The meeting time was changed without telling.',
    'This person was corrected in front of other people.',
    'Someone interrupted this person while talking.',
    'Someone borrowed something and did not return it.',
    'This person was blamed for something they did not do.',
    'Someone was rude to this person for no reason.',
    'This person had to wait outside in the cold.',
    'This person\'s bag was knocked over.',
    'Someone played loud music next to this person.',
    'This person had to repeat themselves many times.'
  ],
  fear: [
    'This person heard a knock at the door very late at night.',
    'This person saw a large dog running toward them.',
    'This person has to go to the dentist today.',
    'This person is walking home alone at night.',
    'This person heard a loud bang outside.',
    'This person is in a small room with no windows.',
    'This person has to speak in front of many people.',
    'This person heard a strange noise inside the house.',
    'This person is home alone and heard something move.',
    'This person saw a spider near their hand.',
    'The fire alarm went off at night.',
    'This person has to go to the hospital today.',
    'This person is near a very tall edge.',
    'This person has to meet many new people at once.',
    'This person saw something moving in the dark.',
    'This person got a message that said call immediately.',
    'This person heard footsteps behind them.',
    'This person is on a high bridge.'
  ],
  surprise: [
    'This person found a note under their door.',
    'This person got a phone call with very good news.',
    'This person walked in and everyone was waiting.',
    'This person checked their bag and found extra money.',
    'This person opened a letter they forgot about.',
    'A friend visited without saying they were coming.',
    'This person opened an unexpected parcel.',
    'This person\'s name was called out in class.',
    'This person found something they lost a long time ago.',
    'This person was given a task they did not expect.',
    'This person received a gift with no name on it.',
    'This person\'s alarm did not go off but they woke up fine.',
    'This person opened the wrong door.',
    'This person saw someone they did not expect to see there.',
    'This person got a message from someone they did not know.',
    'A stranger said something very kind to this person.',
    'This person found a photo they forgot they had taken.',
    'This person was told something they did not know about themselves.'
  ],
  disgust: [
    'This person found mould on their bread.',
    'This person stepped in something wet outside.',
    'This person opened a container of old food.',
    'This person smelled something bad on the bus.',
    'This person found a hair in their food.',
    'This person touched something sticky by accident.',
    'This person saw food they strongly dislike.',
    'This person found old food under their bed.',
    'This person had to clean something very dirty.',
    'This person saw an overflowing bin.',
    'This person touched a wet surface they did not expect.',
    'This person saw a large amount of rubbish on the street.',
    'This person found something rotten in their bag.',
    'This person smelled something bad when they opened a drawer.',
    'This person saw something unpleasant in their food.',
    'This person found a bug in their drink.',
    'This person touched something that felt very unpleasant.',
    'This person saw something that made their stomach feel bad.'
  ],
  neutral: [
    'This person is sitting on a bench outside.',
    'This person is waiting for a friend.',
    'This person is looking out the window.',
    'This person is walking to the shop.',
    'This person is sitting at a desk.',
    'This person is on the bus.',
    'This person is waiting for the bus.',
    'This person is reading a book.',
    'This person is standing in a queue.',
    'This person is walking to class.',
    'This person is sitting in a waiting room.',
    'This person is watching the clock.',
    'This person is eating lunch.',
    'This person is washing the dishes.',
    'This person is putting on their shoes.',
    'This person is looking at a map.',
    'This person is folding their clothes.',
    'This person is waiting for the door to open.'
  ]
};

// Build random questions for a level from the pool
function buildQuestions(emotions, numQuestions) {
  // Shuffle each emotion pool and spread questions evenly
  var buckets = {};
  emotions.forEach(function(em) {
    buckets[em] = (SCENARIO_POOL[em] || []).slice().sort(function(){ return Math.random()-0.5; });
  });

  var result = [];
  // First pass: one of each emotion to ensure variety
  emotions.slice().sort(function(){ return Math.random()-0.5; }).forEach(function(em) {
    if(result.length < numQuestions && buckets[em].length > 0) {
      result.push({ scenario: buckets[em].shift(), emotion: em });
    }
  });
  // Fill remaining slots round-robin
  var i = 0;
  while(result.length < numQuestions) {
    var em = emotions[i % emotions.length];
    if(buckets[em].length > 0) result.push({ scenario: buckets[em].shift(), emotion: em });
    i++;
    if(i > numQuestions * 3) break; // safety
  }
  // Final shuffle
  return result.sort(function(){ return Math.random()-0.5; });
}

// ============================================================
// LEVELS — 5 levels, increasing difficulty
// numChoices: how many answer buttons to show (3–7)
// ============================================================
var LEVELS = [
  {
    id: 1, title: 'Basic Emotions', subtitle: '3 choices · 5 questions',
    angles: ['S'], numChoices: 3, numQuestions: 5,
    emotions: ['happiness','sadness','anger']
  },
  {
    id: 2, title: 'More Emotions', subtitle: '3 choices · 7 questions',
    angles: ['S','HL','HR'], numChoices: 3, numQuestions: 7,
    emotions: ['happiness','sadness','anger','fear','surprise','disgust']
  },
  {
    id: 3, title: 'All Emotions', subtitle: '4 choices · 10 questions',
    angles: ['S','HL','HR','FL','FR'], numChoices: 4, numQuestions: 10,
    emotions: ['happiness','sadness','anger','fear','surprise','disgust','neutral']
  },
  {
    id: 4, title: 'Everyday Situations', subtitle: '5 choices · 15 questions',
    angles: ['S','HL','HR','FL','FR'], numChoices: 5, numQuestions: 15,
    emotions: ['happiness','sadness','anger','fear','surprise','disgust','neutral']
  },
  {
    id: 5, title: 'Expert Level', subtitle: '7 choices · 20 questions',
    angles: ['S','HL','HR','FL','FR'], numChoices: 7, numQuestions: 20,
    emotions: ['happiness','sadness','anger','fear','surprise','disgust','neutral']
  }
];

// ============================================================
// STATE
// ============================================================
var state = {
  currentLevel:     null,
  currentQIndex:    0,
  currentQ:         null,
  currentQuestions: [],
  currentImage:     null,
  wrongAttempts:    0,
  levelScores:      {},
  silenceTimers:    [],
  pendingReg:       null
};

// ============================================================
// SCREENS
// ============================================================
var SCREEN_IDS = ['registration','consent','tutorial','home','quiz','result','stats','settings'];

function showScreen(name) {
  SCREEN_IDS.forEach(function(id) {
    var el = document.getElementById('screen-' + id);
    if (!el) return;
    if (id === name) {
      el.classList.remove('hidden');
      var inner = el.querySelector('.screen-inner');
      if (inner) { inner.style.animation='none'; void inner.offsetWidth; inner.style.animation=''; }
    } else {
      el.classList.add('hidden');
    }
  });
}

function showOverlay(id) { var el=document.getElementById(id); if(el) el.classList.remove('hidden'); }
function hideOverlay(id) { var el=document.getElementById(id); if(el) el.classList.add('hidden'); }

function showConfirm(text, onYes, onNo) {
  document.getElementById('confirm-text').textContent = text;
  showOverlay('overlay-confirm');
  var yes = document.getElementById('btn-confirm-yes');
  var no  = document.getElementById('btn-confirm-no');
  var yn = yes.cloneNode(true); yes.parentNode.replaceChild(yn, yes);
  var nn = no.cloneNode(true);  no.parentNode.replaceChild(nn, no);
  yn.addEventListener('click', function(){ hideOverlay('overlay-confirm'); if(onYes) onYes(); });
  nn.addEventListener('click', function(){ hideOverlay('overlay-confirm'); if(onNo)  onNo();  });
}

// ============================================================
// INLINE CARD
// ============================================================
function showIC(cls, html) {
  var c = document.getElementById('quiz-inline-card');
  c.className = 'quiz-inline-card ' + cls;
  c.innerHTML = html;
}
function hideIC() {
  var c = document.getElementById('quiz-inline-card');
  c.className = 'quiz-inline-card hidden';
  c.innerHTML = '';
}

// ============================================================
// SILENCE PROTOCOL
// ============================================================
function clearST() { state.silenceTimers.forEach(clearTimeout); state.silenceTimers=[]; }

function startST() {
  clearST();
  var quiz = document.getElementById('screen-quiz');
  function gone() { return !quiz || quiz.classList.contains('hidden'); }

  // 60s → hint?
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return;
    showIC('card-silence',
      '<p class="ic-body">Would you like a hint?</p>' +
      '<div class="ic-btns">' +
        '<button class="btn-outline" id="ic-y" style="flex:1">Yes</button>' +
        '<button class="btn-outline" id="ic-n" style="flex:1">No</button>' +
      '</div>');
    document.getElementById('ic-y').addEventListener('click', function(){ hideIC(); showHint(); });
    document.getElementById('ic-n').addEventListener('click', function(){ hideIC(); startST(); });
  }, 60000));

  // 120s → continue?
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return;
    showIC('card-silence',
      '<p class="ic-body">Do you want to continue?</p>' +
      '<div class="ic-btns">' +
        '<button class="btn-outline" id="ic-y" style="flex:1">Yes</button>' +
        '<button class="btn-outline" id="ic-n" style="flex:1">No</button>' +
      '</div>');
    document.getElementById('ic-y').addEventListener('click', function(){ hideIC(); startST(); });
    document.getElementById('ic-n').addEventListener('click', function(){ hideIC(); showGoodbye(); });
  }, 120000));

  // 150s → goodbye, auto-home
  state.silenceTimers.push(setTimeout(function(){
    if(gone()) return;
    clearST();
    showIC('card-silence', '<p class="ic-body">You did good today. Have a nice day. \uD83D\uDC4B</p>');
    setTimeout(function(){ hideIC(); showHome(); }, 3000);
  }, 150000));
}

document.addEventListener('click', function(){
  var q = document.getElementById('screen-quiz');
  if(q && !q.classList.contains('hidden')) startST();
});

// ============================================================
// IMAGES
// ============================================================
function pickImage(emotion, angles) {
  if(!window.IMAGE_INDEX || !window.IMAGE_INDEX[emotion]) return null;
  var shown = store.get(KEYS.SHOWN) || [];
  var pool = window.IMAGE_INDEX[emotion].filter(function(i){
    return angles.indexOf(i.angle) !== -1 && shown.indexOf(i.id) === -1;
  });
  if(pool.length === 0) {
    var ids = window.IMAGE_INDEX[emotion].map(function(i){ return i.id; });
    shown = shown.filter(function(id){ return ids.indexOf(id) === -1; });
    store.set(KEYS.SHOWN, shown);
    pool = window.IMAGE_INDEX[emotion].filter(function(i){ return angles.indexOf(i.angle) !== -1; });
  }
  if(pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function markShown(id) {
  var shown = store.get(KEYS.SHOWN) || [];
  if(shown.indexOf(id) === -1){ shown.push(id); store.set(KEYS.SHOWN, shown); }
}

// ============================================================
// REGISTRATION
// ============================================================
var REG_STEPS = [
  { question:'What is your name?',  type:'text',   key:'name',    placeholder:'Your name' },
  { question:'How old are you?',    type:'choice', key:'ageRange', options:['Under 18','18–25','26–35','Over 35'] },
  { question:'Where are you from?', type:'choice', key:'region',   options:['Europe','Asia','Americas','Other'] }
];
var regData={}, regStep=0;

function startRegistration() {
  regData={}; regStep=0; state.pendingReg=null;
  showScreen('registration'); renderRegStep();
}

function renderRegStep() {
  var step = REG_STEPS[regStep];
  var c = document.getElementById('reg-step-container');
  if(!c) return;

  var dots='';
  for(var d=0;d<REG_STEPS.length;d++) dots+='<span class="reg-dot'+(d===regStep?' active':'')+'"></span>';

  var html = '<div class="reg-dots">'+dots+'</div><p class="reg-question">'+step.question+'</p>';

  if(step.type==='text') {
    html += '<input class="reg-input" id="reg-in" type="text" placeholder="'+step.placeholder+'" maxlength="50" autocomplete="off">' +
            '<div class="btn-stack"><button class="btn-primary" id="btn-reg-next">Next</button></div>';
  } else {
    html += '<div class="btn-stack">';
    step.options.forEach(function(o){ html+='<button class="btn-outline btn-reg-o" data-val="'+o+'">'+o+'</button>'; });
    html += '</div>';
  }
  c.innerHTML = html;

  if(step.type==='text') {
    var inp = document.getElementById('reg-in');
    var nxt = document.getElementById('btn-reg-next');
    if(inp){ inp.focus(); inp.addEventListener('keydown',function(e){ if(e.key==='Enter') advanceReg(inp.value.trim()); }); }
    if(nxt) nxt.addEventListener('click',function(){ advanceReg(inp?inp.value.trim():''); });
  } else {
    c.querySelectorAll('.btn-reg-o').forEach(function(b){ b.addEventListener('click',function(){ advanceReg(b.dataset.val); }); });
  }
}

function advanceReg(v) {
  if(!v) return;
  regData[REG_STEPS[regStep].key]=v;
  regStep++;
  if(regStep>=REG_STEPS.length){ state.pendingReg=regData; startConsent(); }
  else renderRegStep();
}

// ============================================================
// CONSENT
// ============================================================
function startConsent(){ showScreen('consent'); }

document.getElementById('btn-consent-agree').addEventListener('click',function(){
  useSession=false;
  store.set(KEYS.REG, state.pendingReg);
  store.set(KEYS.CONSENT,{given:true, date:new Date().toISOString()});
  startTutorial();
});

document.getElementById('btn-consent-no').addEventListener('click',function(){
  useSession=true;
  store.set(KEYS.REG, state.pendingReg);
  store.set(KEYS.CONSENT,{given:false, date:new Date().toISOString()});
  startTutorial();
});

// ============================================================
// TUTORIAL
// ============================================================
var TUT_SLIDES = ['You will see a face.','Choose the emotion.','You can stop at any time.'];
var tutIdx=0;

function startTutorial(){ tutIdx=0; showScreen('tutorial'); renderTutSlide(); }

function renderTutSlide() {
  var c = document.getElementById('tutorial-container');
  if(!c) return;
  var isLast = tutIdx===TUT_SLIDES.length-1;
  var dots='';
  for(var d=0;d<TUT_SLIDES.length;d++) dots+='<span class="reg-dot'+(d===tutIdx?' active':'')+'"></span>';
  c.innerHTML =
    '<div class="reg-dots">'+dots+'</div>' +
    '<p class="tutorial-text">'+TUT_SLIDES[tutIdx]+'</p>' +
    '<div class="btn-stack">' +
      (isLast?'<button class="btn-primary" id="btn-tut-r">I am ready</button>'
             :'<button class="btn-primary" id="btn-tut-n">Next</button>') +
      '<button class="btn-outline" id="btn-tut-s">Skip</button>' +
    '</div>';
  var n=document.getElementById('btn-tut-n');
  var r=document.getElementById('btn-tut-r');
  var s=document.getElementById('btn-tut-s');
  if(n) n.addEventListener('click',function(){ tutIdx++; renderTutSlide(); });
  if(r) r.addEventListener('click',finishTutorial);
  if(s) s.addEventListener('click',finishTutorial);
}

function finishTutorial(){ store.set(KEYS.TUTORIAL,true); showHome(); }

// ============================================================
// HOME
// ============================================================
function showHome() {
  showScreen('home');
  var reg = store.get(KEYS.REG);
  document.getElementById('home-greeting').textContent =
    'Hi '+(reg&&reg.name?reg.name:'there')+'. \uD83D\uDE0A';
  renderLevelCards();
}

function renderLevelCards() {
  var progress  = store.get(KEYS.PROGRESS) || { completedLevels:[], scores:{} };
  var completed = progress.completedLevels || [];
  var scores    = progress.scores || {};
  var c = document.getElementById('level-cards');
  if(!c) return;
  c.innerHTML = '';

  LEVELS.forEach(function(level, i) {
    var isDone   = completed.indexOf(level.id) !== -1;
    var isLocked = i > 0 && completed.indexOf(LEVELS[i-1].id) === -1;
    var sc       = scores[level.id];
    var isPartial= sc && !isDone && (sc.correct/sc.total) < PASS_THRESHOLD;

    var cls   = isDone ? 'completed' : isLocked ? 'locked' : isPartial ? 'partial' : 'unlocked';
    var badge = isDone ? '\u2713' : isLocked ? '\uD83D\uDD12' : isPartial ? '\u25D0' : '\u25B6';

    var sub = level.subtitle;
    if(sc) sub += ' &nbsp;&#183;&nbsp; ' + sc.correct + '/' + sc.total + ' correct';

    var card = document.createElement('div');
    card.className = 'level-card '+cls;
    card.setAttribute('role','button');
    card.setAttribute('tabindex', isLocked?'-1':'0');
    card.innerHTML =
      '<div><div class="level-card-title">Level '+level.id+': '+level.title+'</div>' +
      '<div class="level-card-sub">'+sub+'</div></div>' +
      '<div class="level-card-badge">'+badge+'</div>';

    if(!isLocked){
      card.addEventListener('click',function(){ startLevel(level.id); });
      card.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' ') startLevel(level.id); });
    }
    c.appendChild(card);
  });
}

document.getElementById('btn-settings').addEventListener('click',function(){ showScreen('settings'); });
document.getElementById('btn-stats-home').addEventListener('click',showStats);

// ============================================================
// QUIZ — start
// ============================================================
function startLevel(levelId) {
  var level = LEVELS.find(function(l){ return l.id===levelId; });
  if(!level) return;
  state.currentLevel     = level;
  state.currentQIndex    = 0;
  state.levelScores      = {};
  state.currentQuestions = buildQuestions(level.emotions, level.numQuestions);
  showScreen('quiz');
  document.getElementById('quiz-level-name').textContent = 'Level '+level.id;
  loadQuestion();
}

// ============================================================
// QUIZ — load question
// ============================================================
function loadQuestion() {
  var level = state.currentLevel;
  var qs    = state.currentQuestions || [];
  var q     = qs[state.currentQIndex];
  if(!q){ finishLevel(); return; }

  state.currentQ      = q;
  state.wrongAttempts = 0;
  state.currentImage  = null;

  document.getElementById('quiz-progress-text').textContent =
    (state.currentQIndex+1)+' / '+qs.length;
  document.getElementById('quiz-scenario').textContent = q.scenario;

  loadPhoto(q.emotion, level.angles);
  renderAnswers(q.emotion, level.numChoices);
  hideFeedback();
  hideIC();
  startST();
}

function loadPhoto(emotion, angles) {
  var el   = document.getElementById('quiz-photo');
  var wrap = document.getElementById('quiz-photo-wrap');
  var old  = wrap.querySelector('.photo-placeholder');
  if(old) old.remove();

  var img = pickImage(emotion, angles);
  state.currentImage = img;

  if(img) {
    el.style.display='block'; el.className='quiz-photo'; el.src=img.path;
    el.onerror=function(){ el.style.display='none'; showPlaceholder(emotion); };
  } else {
    el.style.display='none'; showPlaceholder(emotion);
  }
}

function showPlaceholder(emotion) {
  var wrap=document.getElementById('quiz-photo-wrap');
  var div=document.createElement('div');
  div.className='photo-placeholder';
  div.style.background=EMO_BG_HEX[emotion]||'#888';
  div.style.color='rgba(255,255,255,0.85)';
  div.textContent=EMOTION_LABELS[emotion]||emotion;
  wrap.insertBefore(div,wrap.firstChild);
}

// ============================================================
// QUIZ — answers (variable number of choices: 3–7)
// ============================================================
function renderAnswers(correct, numChoices) {
  var c = document.getElementById('quiz-answers');
  c.innerHTML = '';

  var choices;
  if(numChoices >= ALL_EMOTIONS.length) {
    // Level 5: all 7 emotions
    choices = ALL_EMOTIONS.slice();
  } else {
    var wrongs = ALL_EMOTIONS.filter(function(e){ return e!==correct; });
    wrongs.sort(function(){ return Math.random()-0.5; });
    choices = [correct].concat(wrongs.slice(0, numChoices-1));
  }
  choices.sort(function(){ return Math.random()-0.5; });

  choices.forEach(function(emotion){
    var btn=document.createElement('button');
    btn.className='btn-answer';
    btn.textContent=EMOTION_LABELS[emotion];
    btn.dataset.emotion=emotion;
    btn.setAttribute('aria-label','Answer: '+EMOTION_LABELS[emotion]);
    btn.addEventListener('click',function(){ onAnswer(emotion, correct); });
    c.appendChild(btn);
  });
}

// ============================================================
// QUIZ — answer logic
// ============================================================
function onAnswer(selected, correct) {
  startST();
  if(selected===correct) handleCorrect(correct);
  else handleWrong(correct);
}

function handleCorrect(correct) {
  state.levelScores[state.currentQIndex]=true;
  updateStats(correct, true);
  if(state.currentImage) markShown(state.currentImage.id);

  var photo=document.getElementById('quiz-photo');
  photo.classList.remove('shake'); void photo.offsetWidth; photo.classList.add('glow');
  showFeedback('Correct. \u2713');

  document.querySelectorAll('.btn-answer').forEach(function(b){
    b.disabled=true;
    if(b.dataset.emotion===correct) b.classList.add('correct');
  });

  setTimeout(function(){
    photo.classList.remove('glow'); hideFeedback();
    state.currentQIndex++; loadQuestion();
  }, 1500);
}

function handleWrong(correct) {
  state.wrongAttempts++;
  updateStats(correct, false);

  var photo=document.getElementById('quiz-photo');
  photo.classList.remove('shake'); void photo.offsetWidth; photo.classList.add('shake');
  setTimeout(function(){ photo.classList.remove('shake'); }, 350);

  if(state.wrongAttempts===1) {
    showFeedback("Let's try again.");
    setTimeout(hideFeedback, 1800);
  } else if(state.wrongAttempts===2) {
    clearST();
    showIC('card-hint',
      '<p class="ic-label">Hint available</p>' +
      '<p class="ic-body">Do you want a hint?</p>' +
      '<div class="ic-btns">' +
        '<button class="btn-outline" id="ic-sh" style="flex:1">Show hint</button>' +
        '<button class="btn-outline" id="ic-tr" style="flex:1">Try again</button>' +
        '<button class="btn-outline" id="ic-ex" style="flex:1">Exit</button>' +
      '</div>');
    document.getElementById('ic-sh').addEventListener('click',function(){ hideIC(); showHint(); });
    document.getElementById('ic-tr').addEventListener('click',function(){ hideIC(); startST(); });
    document.getElementById('ic-ex').addEventListener('click',function(){ hideIC(); showGoodbye(); });
  } else {
    clearST();
    state.levelScores[state.currentQIndex]=false;
    if(state.currentImage) markShown(state.currentImage.id);
    showReveal(correct);
  }
}

function showFeedback(t){ var e=document.getElementById('quiz-feedback'); e.textContent=t; e.classList.remove('hidden'); }
function hideFeedback(){  document.getElementById('quiz-feedback').classList.add('hidden'); }

function showHint() {
  var em = state.currentQ && state.currentQ.emotion;
  showIC('card-hint',
    '<p class="ic-label">Hint</p>' +
    '<p class="ic-body">'+(em ? EMOTION_HINTS[em] : 'Look at the whole face.')+'</p>' +
    '<button class="ic-btn-full" id="ic-bk">Back to question</button>');
  document.getElementById('ic-bk').addEventListener('click',function(){ hideIC(); startST(); });
}

document.getElementById('btn-hint-link').addEventListener('click',function(){ startST(); showHint(); });

function showReveal(correct) {
  var color = EMO_BG_HEX[correct]||'#666';
  showIC('card-reveal',
    '<p class="ic-label">The answer is:</p>' +
    '<p class="ic-emotion" style="color:'+color+'">'+EMOTION_LABELS[correct]+'</p>' +
    '<p class="ic-desc">'+(EMOTION_REVEAL[correct]||EMOTION_HINTS[correct])+'</p>' +
    '<button class="ic-btn-full" id="ic-ct">Continue</button>');
  document.getElementById('ic-ct').addEventListener('click',function(){
    hideIC(); state.currentQIndex++; loadQuestion();
  });
}

// ============================================================
// QUIT
// ============================================================
document.getElementById('btn-quit').addEventListener('click',function(){
  clearST();
  showConfirm('Do you want to stop?',
    function(){ showGoodbye(); },
    function(){ startST(); }
  );
});

function showGoodbye(){ clearST(); hideIC(); showOverlay('overlay-goodbye'); }

document.getElementById('btn-goodbye-home').addEventListener('click',function(){
  hideOverlay('overlay-goodbye'); hideOverlay('overlay-confirm'); showHome();
});

// ============================================================
// FINISH LEVEL — 70% soft threshold
// ============================================================
function finishLevel() {
  clearST();
  var level   = state.currentLevel;
  var total   = (state.currentQuestions || []).length || level.numQuestions;
  var correct = Object.values(state.levelScores).filter(function(v){ return v===true; }).length;
  var pct     = correct / total;
  var passed  = pct >= PASS_THRESHOLD;

  // Save progress
  var progress = store.get(KEYS.PROGRESS) || { completedLevels:[], scores:{} };
  if(!progress.completedLevels) progress.completedLevels=[];
  if(!progress.scores) progress.scores={};
  progress.scores[level.id] = { correct:correct, total:total };
  if(passed && progress.completedLevels.indexOf(level.id)===-1) {
    progress.completedLevels.push(level.id);
  }
  store.set(KEYS.PROGRESS, progress);

  // Strongest / weakest
  var acc = (store.get(KEYS.STATS)||{}).emotionAccuracy || {};
  var strongest=null, weakest=null, hi=-1, lo=2;
  ALL_EMOTIONS.forEach(function(em){
    var d=acc[em];
    if(d&&d.total>0){ var r=d.correct/d.total; if(r>hi){hi=r;strongest=em;} if(r<lo){lo=r;weakest=em;} }
  });

  // Result screen
  document.getElementById('result-score').textContent =
    'You got '+correct+' out of '+total+' correct.';

  if(passed) {
    document.getElementById('result-title').textContent = 'Level complete. \u2713';
    document.getElementById('result-message').textContent = '';
    document.getElementById('btn-next-level').style.display = '';
    document.getElementById('btn-try-again').style.display  = 'none';
  } else {
    document.getElementById('result-title').textContent = 'Level finished.';
    document.getElementById('result-message').textContent =
      'You need 70% to unlock the next level. Try again to improve.';
    document.getElementById('btn-next-level').textContent = 'Continue anyway';
    document.getElementById('btn-next-level').style.display = '';
    document.getElementById('btn-try-again').style.display  = '';
  }

  document.getElementById('result-strongest').textContent =
    strongest ? 'Strongest: '+EMOTION_LABELS[strongest] : '';
  document.getElementById('result-weakest').textContent =
    (weakest&&weakest!==strongest) ? 'Needs practice: '+EMOTION_LABELS[weakest] : '';

  showScreen('result');
}

document.getElementById('btn-next-level').addEventListener('click',function(){
  // Always unlock next level when this button is pressed
  var progress = store.get(KEYS.PROGRESS) || { completedLevels:[], scores:{} };
  if(!progress.completedLevels) progress.completedLevels=[];
  var lid = state.currentLevel ? state.currentLevel.id : 0;
  if(progress.completedLevels.indexOf(lid)===-1) progress.completedLevels.push(lid);
  store.set(KEYS.PROGRESS, progress);

  var next = LEVELS.find(function(l){ return l.id===lid+1; });
  if(next) startLevel(next.id); else showHome();
  // Reset button text in case it was changed
  document.getElementById('btn-next-level').textContent = 'Next level';
});

document.getElementById('btn-try-again').addEventListener('click',function(){
  if(state.currentLevel) startLevel(state.currentLevel.id);
  else showHome();
});

document.getElementById('btn-result-home').addEventListener('click',function(){
  document.getElementById('btn-next-level').textContent='Next level';
  showHome();
});

// ============================================================
// STATS
// ============================================================
var EMO_BAR = {
  happiness:'#C8960C', sadness:'#2878B0', anger:'#B03030',
  fear:'#6B4BAB', surprise:'#0E8A7A', disgust:'#5A8A28', neutral:'#7A746C'
};

function showStats() {
  showScreen('stats');
  var stats = store.get(KEYS.STATS)||{};
  var acc   = stats.emotionAccuracy||{};
  var c     = document.getElementById('stats-bars');
  c.innerHTML='';

  ALL_EMOTIONS.forEach(function(em){
    var d   = acc[em]||{correct:0,total:0};
    var pct = d.total>0 ? Math.round((d.correct/d.total)*100) : 0;
    var row = document.createElement('div');
    row.className='stat-bar-row';
    row.innerHTML =
      '<div class="stat-bar-label"><span>'+EMOTION_LABELS[em]+'</span><span>'+pct+'%</span></div>' +
      '<div class="stat-bar-track"><div class="stat-bar-fill" style="width:'+pct+'%;background:'+EMO_BAR[em]+'"></div></div>';
    c.appendChild(row);
  });

  document.getElementById('stats-total').textContent  = 'Total answered: '+(stats.totalAnswered||0);
  document.getElementById('stats-streak').textContent = 'Days in a row: ' +(stats.streakDays||0);
}

document.getElementById('btn-stats-back').addEventListener('click',showHome);

// ============================================================
// SETTINGS
// ============================================================
document.getElementById('btn-replay-tutorial').addEventListener('click',startTutorial);

document.getElementById('btn-delete-data').addEventListener('click',function(){
  showConfirm('Delete all your data?',function(){
    store.clearAll(); useSession=false; startRegistration();
  },function(){});
});

document.getElementById('btn-settings-back').addEventListener('click',showHome);

// ============================================================
// STATS TRACKING
// ============================================================
function updateStats(emotion, correct) {
  var stats = store.get(KEYS.STATS)||{emotionAccuracy:{},totalAnswered:0,streakDays:0,lastDate:null};
  if(!stats.emotionAccuracy) stats.emotionAccuracy={};
  if(!stats.emotionAccuracy[emotion]) stats.emotionAccuracy[emotion]={correct:0,total:0};
  stats.emotionAccuracy[emotion].total++;
  if(correct) stats.emotionAccuracy[emotion].correct++;
  stats.totalAnswered=(stats.totalAnswered||0)+1;
  var today=new Date().toDateString(), yesterday=new Date(Date.now()-86400000).toDateString();
  if(stats.lastDate!==today){
    stats.streakDays=(stats.lastDate===yesterday)?(stats.streakDays||0)+1:1;
    stats.lastDate=today;
  }
  store.set(KEYS.STATS,stats);
}

// ============================================================
// INIT
// ============================================================
function init() {
  // Check localStorage (persistent users)
  var lr=localStorage.getItem(KEYS.REG), lc=localStorage.getItem(KEYS.CONSENT);
  if(lr&&lc){ var c=JSON.parse(lc); if(c.given){ useSession=false; var t=store.get(KEYS.TUTORIAL); if(t) showHome(); else startTutorial(); return; } }

  // Check sessionStorage (session users)
  var sr=sessionStorage.getItem(KEYS.REG), sc=sessionStorage.getItem(KEYS.CONSENT);
  if(sr&&sc){ useSession=true; var t2=store.get(KEYS.TUTORIAL); if(t2) showHome(); else startTutorial(); return; }

  startRegistration();
}

if(!Array.prototype.find){ Array.prototype.find=function(cb){ for(var i=0;i<this.length;i++) if(cb(this[i],i,this)) return this[i]; }; }
if(!Object.values){ Object.values=function(o){ return Object.keys(o).map(function(k){ return o[k]; }); }; }

document.addEventListener('DOMContentLoaded', init);
