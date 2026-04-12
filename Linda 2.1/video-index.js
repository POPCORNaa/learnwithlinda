// video-index.js
// RAVDESS video-only (02) speech (01) files for Actor 12 (female) and Actor 11 (male)
// Filename: 02-01-[emotion]-[intensity]-[statement]-[repetition]-[actor].mp4
// Emotions: 01=neutral,02=calm,03=happy,04=sad,05=angry,06=fearful,07=disgust,08=surprised
// Intensity: 01=normal, 02=strong (no strong for neutral)
// Statements: 01,02 | Repetitions: 01,02

(function () {

  var EMOTION_MAP = {
    '01': 'neutral',
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '06': 'fearful',
    '07': 'disgust',
    '08': 'surprised'
  };

  // We map RAVDESS emotions → app emotions
  // 'calm' is treated separately — used as a distinct emotion in Module 2/4
  var APP_EMOTION_MAP = {
    'neutral':   'neutral',
    'calm':      'calm',
    'happy':     'happiness',
    'sad':       'sadness',
    'angry':     'anger',
    'fearful':   'fear',
    'disgust':   'disgust',
    'surprised': 'surprise'
  };

  var actors = [
    { id: '12', gender: 'female' },
    { id: '11', gender: 'male'   }
  ];

  // Build index
  // Structure: VIDEO_INDEX[gender][appEmotion] = [ {id, path, emotion, appEmotion, intensity, statement, repetition, actor, gender}, ... ]

  var index = {
    female: {},
    male:   {}
  };

  // All app emotions we support
  var allAppEmotions = ['neutral','calm','happiness','sadness','anger','fear','disgust','surprise'];
  allAppEmotions.forEach(function(e) {
    index.female[e] = [];
    index.male[e]   = [];
  });

  actors.forEach(function(actor) {
    var gender = actor.gender;

    Object.keys(EMOTION_MAP).forEach(function(emoCode) {
      var ravEmotion = EMOTION_MAP[emoCode];
      var appEmotion = APP_EMOTION_MAP[ravEmotion];

      // Intensities: neutral only has 01, others have 01 and 02
      var intensities = (emoCode === '01') ? ['01'] : ['01', '02'];

      intensities.forEach(function(intensity) {
        ['01', '02'].forEach(function(statement) {
          ['01', '02'].forEach(function(repetition) {
            var modality = '02'; // video-only
            var vocalChannel = '01'; // speech for both actors
            var filename = modality + '-' + vocalChannel + '-' + emoCode + '-' + intensity + '-' + statement + '-' + repetition + '-' + actor.id + '.mp4';
            var entry = {
              id:          actor.id + '-' + emoCode + '-' + intensity + '-' + statement + '-' + repetition,
              path:        'video/Actor_' + (parseInt(actor.id)) + '/' + filename,
              ravEmotion:  ravEmotion,
              appEmotion:  appEmotion,
              intensity:   intensity === '01' ? 'normal' : 'strong',
              statement:   statement,
              repetition:  repetition,
              actor:       actor.id,
              gender:      gender
            };
            index[gender][appEmotion].push(entry);
          });
        });
      });
    });
  });

  window.VIDEO_INDEX = index;

  // Log summary
  var total = 0;
  ['female','male'].forEach(function(g) {
    Object.keys(index[g]).forEach(function(e) {
      total += index[g][e].length;
    });
  });
  console.log('[Linda] VIDEO_INDEX loaded. Total video entries:', total);

  // Helper: get a specific video
  // getVideos(gender, appEmotion, filters)
  // filters: { intensity, statement, repetition }
  window.getVideos = function(gender, appEmotion, filters) {
    var pool = (index[gender] && index[gender][appEmotion]) ? index[gender][appEmotion] : [];
    if (!filters) return pool;
    return pool.filter(function(v) {
      if (filters.intensity  && v.intensity  !== filters.intensity)  return false;
      if (filters.statement  && v.statement  !== filters.statement)  return false;
      if (filters.repetition && v.repetition !== filters.repetition) return false;
      return true;
    });
  };

  // Helper: random pick
  window.pickVideo = function(gender, appEmotion, filters) {
    var pool = window.getVideos(gender, appEmotion, filters);
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Helper: pick a pair for Module 2 (same statement, same emotion, normal vs strong)
  window.pickIntensityPair = function(gender, appEmotion) {
    // Get all normal videos for this emotion
    var normalPool = window.getVideos(gender, appEmotion, { intensity: 'normal' });
    var strongPool = window.getVideos(gender, appEmotion, { intensity: 'strong' });
    if (!normalPool.length || !strongPool.length) return null;

    // Pick a statement that exists in both
    var statements = ['01','02'];
    var validStatements = statements.filter(function(s) {
      return normalPool.some(function(v){ return v.statement === s; }) &&
             strongPool.some(function(v){ return v.statement === s; });
    });
    if (!validStatements.length) return null;

    var stmt = validStatements[Math.floor(Math.random() * validStatements.length)];
    var normals = normalPool.filter(function(v){ return v.statement === stmt; });
    var strongs = strongPool.filter(function(v){ return v.statement === stmt; });

    return {
      normal: normals[Math.floor(Math.random() * normals.length)],
      strong: strongs[Math.floor(Math.random() * strongs.length)]
    };
  };

})();
