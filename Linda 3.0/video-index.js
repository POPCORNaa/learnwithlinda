// video-index.js
// RAVDESS — modality 01 (audio+video), speech, normal intensity
// Female actors: 01-12 | Male actors: 13-24
// Emotions: neutral(01), happiness(03), sadness(04), anger(05), fear(06), disgust(07), surprise(08)
// Statements: 01="Kids are talking by the door", 02="Dogs are sitting by the door"

(function () {

  var EMOTION_MAP = {
    '01': 'neutral',
    '03': 'happiness',
    '04': 'sadness',
    '05': 'anger',
    '06': 'fear',
    '07': 'disgust',
    '08': 'surprise'
  };

  var STATEMENTS = ['01', '02'];

  // Female: 01-12, Male: 13-24
  var ACTORS = [];
  for (var n = 1; n <= 24; n++) {
    var aid    = n < 10 ? '0' + n : '' + n;
    var gender = n <= 12 ? 'female' : 'male';
    ACTORS.push({ id: aid, gender: gender });
  }

  var index = { female: {}, male: {} };
  var ALL_APP_EMOTIONS = ['neutral','happiness','sadness','anger','fear','disgust','surprise'];

  ALL_APP_EMOTIONS.forEach(function(e) {
    index.female[e] = [];
    index.male[e]   = [];
  });

  ACTORS.forEach(function(actor) {
    Object.keys(EMOTION_MAP).forEach(function(emoCode) {
      var appEmotion = EMOTION_MAP[emoCode];
      STATEMENTS.forEach(function(stmt) {
        var filename = '01-01-' + emoCode + '-01-' + stmt + '-01-' + actor.id + '.mp4';
        index[actor.gender][appEmotion].push({
          id:         actor.id + '-' + emoCode + '-s' + stmt,
          path:       'video_selected/Actor_' + actor.id + '/' + filename,
          appEmotion: appEmotion,
          actor:      actor.id,
          gender:     actor.gender
        });
      });
    });
  });

  window.VIDEO_INDEX = index;

  // Pick a specific actor's video for a given emotion (random statement)
  window.pickVideoForActor = function(actorId, appEmotion) {
    var gender = parseInt(actorId, 10) <= 12 ? 'female' : 'male';
    var pool   = (index[gender] && index[gender][appEmotion])
      ? index[gender][appEmotion].filter(function(v) { return v.actor === actorId; })
      : [];
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  var total = 0;
  ALL_APP_EMOTIONS.forEach(function(e) {
    total += index.female[e].length + index.male[e].length;
  });
  console.log('[Linda] VIDEO_INDEX loaded. Total clips:', total);

})();
