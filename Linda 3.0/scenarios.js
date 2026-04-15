// scenarios.js

(function () {

  window.UNI_SCENARIOS = {

    happiness: [
      'You just checked your exam results and you passed the test you were most worried about.',
      'You got an email saying your scholarship application was successful.',
      'Your friend surprised you with your favourite coffee before the morning lecture.',
      'Your group project got the highest grade in the class.',
      'You arrived at university and found out your lecture has been cancelled today.',
      'You found the last free quiet desk in the library just when you needed it.',
      'Your flatmate cooked a full dinner for everyone without being asked.',
      'Your boss just approved the extra shift you asked for this weekend.',
      'Your professor read your essay out loud as a good example to the whole class.',
      'The café had your favourite cake left and it was the last one.',
      'After struggling for weeks, something finally clicked and you understood the topic.',
      'Your friend saved your seat in a packed lecture hall.',
      'You got a reply from the internship you really wanted — they want an interview.',
      'You came home cold and tired, and your roommate had already turned the heating on.',
      'You submitted your assignment with ten minutes to spare after working all night.',
      'A long study session finally went well and you feel like you actually learned something.',
      'You got accepted onto the course you really wanted next semester.',
      'Your bus pass worked on the first try after it kept failing all week.'
    ],

    sadness: [
      'You worked really hard on an assignment but got a much lower grade than you expected.',
      'Your closest friend just told you they are moving to another country for a year.',
      'You missed the deadline for an important piece of coursework.',
      'You sat in the canteen at lunch and nobody joined you — again.',
      'Your laptop crashed the night before your deadline and you lost some of your work.',
      'You did most of the group project yourself while your partner did nothing.',
      'You were rejected from the study abroad programme you really wanted.',
      'Your flatmate suddenly told you they are moving out next week.',
      'Your family called to say your pet at home is sick and might not recover.',
      'You got a rejection email from the internship you spent days applying for.',
      'You sat through the whole lecture and understood almost nothing.',
      'Your close friend has stopped replying to your messages without any explanation.',
      'You forgot about a campus event you really wanted to go to and it has already ended.',
      'Your part-time job cut your hours and you need the money.',
      'You spent the whole weekend studying but still feel completely unprepared.',
      'You got to the campus gate and realised you left your student card at home.',
      'Your presentation partner dropped out the night before you were due to present.',
      'You arrived at the canteen just as they were closing and missed lunch.'
    ],

    anger: [
      'Someone sat in your assigned lab seat and refused to move even when you showed them your name on the list.',
      'You just found out a classmate copied large parts of your assignment and submitted it as their own.',
      'You realised everyone in your course was added to a group chat except you.',
      'Your flatmate ate the meal you labelled and left in the fridge without asking.',
      'The only printer available broke down five minutes before your assignment needed to be handed in.',
      'Your lecturer uploaded the wrong file to the portal and nobody noticed until the night before the exam.',
      'You were presenting your idea in class and someone kept talking over you.',
      'Someone is playing loud music in the designated quiet study area and ignoring everyone.',
      'Your whole group got marked down because of a mistake and they blamed it entirely on you.',
      'The seminar room was changed at the last minute and nobody sent you the message.',
      'Your flatmate had people over making noise until 3am on a night before your exam.',
      'You waited 40 minutes for the campus shuttle and it never arrived.',
      'You reserved a library book a week ago but someone else took it before you could collect it.',
      'You submitted the wrong version of a document because the folder was not clearly labelled.',
      'Every time you tried to speak in the seminar someone interrupted you.',
      'You were charged twice for the same meal and had to wait in a long queue to get a refund.',
      'Your tutor cancelled their office hours at the last minute with no explanation.',
      'Your group chat was full of messages after midnight about something that could have waited.'
    ],

    fear: [
      'You have to do a solo presentation in front of the whole class tomorrow and you are not ready.',
      'You just got an email asking you to come to the department office, with no reason given.',
      'The exam starts in an hour and you have not had time to study properly for it.',
      'The submission portal is showing an error right before the midnight deadline.',
      'You are working late in a campus building and realise you are completely alone inside.',
      'You have your first meeting with your dissertation supervisor tomorrow and do not know what to say.',
      'You hear a strange and repeated noise coming from outside your window late at night.',
      'You are waiting for medical test results that could affect your future at university.',
      'You have to defend your project in front of a panel of professors next week.',
      'The fire alarm went off at 2am and you are standing outside not knowing if it is real.',
      'You are starting a new work placement next week in an office where you know nobody.',
      'You noticed an unexpected charge on your bank account and do not recognise where it came from.',
      'You got on what you thought was the right bus but nothing looks familiar outside.',
      'You are moving into a flat you have never seen in person with people you do not know.',
      'You have to cold-call a company to ask about work experience and you are about to dial the number.',
      'Your visa renewal has been pending for weeks and the portal still says processing.',
      'You have to walk home alone through a poorly lit street because the last bus already left.',
      'You cannot remember whether you actually pressed submit on your assignment or just saved it.'
    ],

    disgust: [
      'You opened the kitchen cupboard and found mouldy old food that has been there for weeks.',
      'You walked into the communal bathroom and it was completely filthy.',
      'You sat down on a seat on the bus and it was wet for no obvious reason.',
      'The dishes in the shared kitchen sink have been sitting there unwashed for two weeks.',
      'You went to shower and found clumps of someone else\'s hair covering the drain.',
      'Someone reheated strong-smelling fish in the canteen microwave right next to you.',
      'You opened your lunchbox and realised the food inside had gone off.',
      'You opened the shared fridge and were hit by a powerful bad smell.',
      'You reached under a desk and accidentally touched old chewing gum stuck there.',
      'Someone spilled something in the microwave and left it without cleaning it up.',
      'You found what looked like a bug in your takeaway from the campus café.',
      'The shared bin in the kitchen is so full that the lid will not close and things are spilling out.',
      'You noticed a patch of black mould growing in the corner of your room.',
      'Your flatmate left their sweaty gym clothes on the shared living room sofa.',
      'You found a container of very old food at the bottom of your bag from weeks ago.',
      'You went to use equipment in the lab and found it had not been cleaned after the last person used it.',
      'You walked across the library floor and your shoe stuck to something wet.',
      'You opened the shared washing machine and found someone else\'s damp clothes rotting inside.'
    ],

    surprise: [
      'You just found out you were nominated for a student award by your professor without knowing.',
      'Your professor told the class to put their work away — today\'s session is a free discussion.',
      'Halfway through the seminar you realised it was being marked and nobody had warned you.',
      'Your manager offered you a promotion out of nowhere after just a few weeks in the job.',
      'You turned a corner on campus and ran into a friend you have not seen since primary school.',
      'A classmate quoted something small and specific you said months ago — you had completely forgotten.',
      'Your grade came back and it was much higher than anything you expected.',
      'A package you ordered and completely forgot about just arrived at your door.',
      'You came home to find your flatmate had rearranged and redecorated the whole living room overnight.',
      'You showed up to class only to find out it is actually scheduled for next week.',
      'The guest speaker walked in and you immediately recognised them from somewhere unexpected.',
      'You put on an old jacket and found a twenty-pound note in the pocket.',
      'Your supervisor told you they are approving your entire proposal exactly as you wrote it.',
      'A classmate you barely know sent you detailed notes that covered everything you had missed.',
      'Your phone rang and it was a company calling about a job application you sent months ago.',
      'You checked your bank account and your bursary payment was significantly more than usual.',
      'Your friends organised a surprise get-together for you without giving any hints.',
      'You were asked at the last minute to speak on a university panel in front of a large audience.'
    ],

    neutral: [
      'You are sitting in the library waiting for your study group to arrive.',
      'You are on the campus bus heading to your next lecture.',
      'You are standing in the queue at the coffee shop between classes.',
      'You are sitting at your desk reading through your notes from last week.',
      'You are waiting outside the seminar room for the previous class to finish.',
      'You are walking from one building to the next for your afternoon class.',
      'You are checking your timetable to see what you have scheduled for tomorrow.',
      'You are sitting in the student union with nothing in particular to do.',
      'You are filling in a standard form at the student services desk.',
      'You are waiting outside the printing room for the machine to become free.',
      'You are sitting in an empty study room before anyone else has arrived.',
      'You are eating lunch by yourself between lectures.',
      'You are watching a recorded lecture on your laptop at home.',
      'You are sorting through a stack of old printed notes at your desk.',
      'You are walking back to halls after a full day on campus.',
      'You are waiting in the hallway for the bathroom to become free.',
      'You are packing your bag with everything you need for tomorrow.',
      'You are sitting in the waiting area at the university health centre.'
    ]

  };

})();
