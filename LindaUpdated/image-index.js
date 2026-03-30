// image-index.js
// Programmatically generates all KDEF image paths.
// No need to run scan-images.js unless you want a static version.
// Images must be extracted to: KDEF_and_AKDEF/KDEF/{subject}/{filename}.JPG

(function () {
  var subjects = [];
  ['AF', 'AM', 'BF', 'BM'].forEach(function (prefix) {
    for (var i = 1; i <= 35; i++) {
      subjects.push(prefix + String(i).padStart(2, '0'));
    }
  });

  var emotionMap = {
    'AF': 'fear',
    'AN': 'anger',
    'DI': 'disgust',
    'HA': 'happiness',
    'NE': 'neutral',
    'SA': 'sadness',
    'SU': 'surprise'
  };

  var angles = ['S', 'HL', 'HR', 'FL', 'FR'];

  var index = {
    fear: [], anger: [], disgust: [],
    happiness: [], neutral: [], sadness: [], surprise: []
  };

  subjects.forEach(function (subject) {
    Object.keys(emotionMap).forEach(function (code) {
      var emotion = emotionMap[code];
      angles.forEach(function (angle) {
        var filename = subject + code + angle + '.JPG';
        index[emotion].push({
          id: subject + code + angle,
          path: 'KDEF_and_AKDEF/KDEF/' + subject + '/' + filename,
          angle: angle
        });
      });
    });
  });

  window.IMAGE_INDEX = index;

  // Log totals to console for verification
  var total = 0;
  Object.keys(index).forEach(function (e) { total += index[e].length; });
  console.log('[Leona] IMAGE_INDEX loaded. Total images indexed:', total);
})();
