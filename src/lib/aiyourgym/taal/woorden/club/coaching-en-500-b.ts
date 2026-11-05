// Engelse coaching van de uitbreiding van migratie 500, deel B (kettlebell,
// staand en sprongen). Het Nederlands (coaching/uitbreiding-500-b.ts) is de bron.

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_500_B: Readonly<Record<string, Coaching>> = {
  'Kettlebell clean': {
    kernpunten: [
      { punt: 'Hips give the drive', uitleg: 'Like the swing, the power comes from your hips. Your arm only guides the bell close to your body.' },
      { punt: 'Bell around your hand', uitleg: 'The bell rotates around your hand onto your forearm. It does not flip over your wrist.' },
      { punt: 'Elbow against your torso', uitleg: 'In the end position your elbow rests against your ribs and the bell on your forearm.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips and the kettlebell a little in front of you.',
      'Hinge at your hips and grip the handle with one hand.',
    ],
    stappen: [
      'Swing the bell back between your legs.',
      'Extend your hips powerfully and pull the bell up close to your body.',
      'Let your hand rotate around the handle so the bell lands softly on your forearm, then swing back.',
    ],
    fouten: [
      { fout: 'Bell crashes onto your forearm', beter: 'Keep it closer to your body and rotate your hand around it earlier.' },
      { fout: 'Squatting instead of hinging', beter: 'Push your hips back. Your knees only bend a little.' },
    ],
    ademhaling: 'Breathe in briefly as the bell goes back and out as it lands on your forearm.',
    tempo: 'Smooth, one clean per swing.',
    makkelijker: 'First learn the two handed kettlebell swing.',
    zwaarder: 'Choose a heavier bell or clean two bells at the same time.',
  },
  'Kettlebell snatch': {
    kernpunten: [
      { punt: 'Learn the swing first', uitleg: 'The snatch is the swing that continues overhead. No good snatch without a good swing.' },
      { punt: 'Punch your hand through', uitleg: 'Punch your hand through the handle at the top. Then the bell lands softly on your forearm.' },
      { punt: 'Straight arm at the top', uitleg: 'At the top your arm is straight above your shoulder and the bell is still.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips and the kettlebell a little in front of you.',
      'Hinge at your hips and grip the handle with one hand.',
    ],
    stappen: [
      'Swing the bell back between your legs.',
      'Extend your hips explosively and let the bell travel up close to your body.',
      'Punch your hand through until your arm is straight overhead, then let the bell drop back into the swing.',
    ],
    fouten: [
      { fout: 'Bell crashes onto your forearm', beter: 'Punch your hand through earlier and keep the bell closer to your body.' },
      { fout: 'Arm does all the work', beter: 'Let your hips give the speed. Your arm only guides.' },
    ],
    ademhaling: 'Breathe in briefly as the bell goes back and out as it stands still at the top.',
    tempo: 'Smooth, one snatch per swing, a short pause at the top.',
    makkelijker: 'First practise the kettlebell clean.',
    zwaarder: 'Choose a heavier bell or do more reps per minute.',
  },
  'Eenarmige kettlebell swing': {
    kernpunten: [
      { punt: 'Torso does not rotate', uitleg: 'Your shoulders keep facing forward. The bell tries to twist you, your core resists.' },
      { punt: 'Shoulder down', uitleg: 'Pull your shoulder down. Your arm is like a rope to the bell.' },
      { punt: 'Power from your hips', uitleg: 'Drive your hips forward hard. Your arm does not lift the bell.' },
    ],
    opstelling: [
      'Stand with your feet slightly wider than your hips and the kettlebell a little in front of you.',
      'Hinge at your hips and grip the handle with one hand.',
    ],
    stappen: [
      'Swing the bell back between your legs.',
      'Extend your hips powerfully so the bell floats up to chest height.',
      'Let the bell fall back and catch it with your hips in the next swing.',
    ],
    fouten: [
      { fout: 'Torso rotates open', beter: 'Brace your core harder and choose a lighter bell.' },
      { fout: 'Shoulder shrugs up', beter: 'Push your shoulder down and let your arm hang loose.' },
    ],
    ademhaling: 'Breathe in as the bell goes back and out as your hips extend.',
    tempo: 'Smooth, about one swing per second.',
    makkelijker: 'Choose the two handed kettlebell swing.',
    zwaarder: 'Switch hands at the top of the swing.',
  },
  'Kettlebell press': {
    kernpunten: [
      { punt: 'Wrist straight under the bell', uitleg: 'Your wrist is straight and the bell rests on your forearm. That way you press in a straight line.' },
      { punt: 'Glutes and core on', uitleg: 'Brace everything before you press. Your torso does not lean sideways or back.' },
      { punt: 'Lower with control', uitleg: 'Lower the bell calmly back to the rack position.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart.',
      'Hold the kettlebell in the rack position at shoulder height, the bell against your forearm and your elbow against your ribs.',
    ],
    stappen: [
      'Squeeze your glutes and brace your core.',
      'Press the bell straight up until your arm is straight.',
      'Lower it under control back to your shoulder.',
    ],
    fouten: [
      { fout: 'Leaning sideways', beter: 'Choose a lighter bell and squeeze your glutes harder.' },
      { fout: 'Wrist bends back', beter: 'Keep your knuckles to the ceiling and your wrist straight.' },
    ],
    ademhaling: 'Breathe in at the bottom, out as you press.',
    tempo: '1 count up, 2 counts down.',
    makkelijker: 'Choose a lighter bell or the seated dumbbell shoulder press.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Kettlebell halo': {
    kernpunten: [
      { punt: 'Close to your head', uitleg: 'The bell circles in a small loop close to your head and neck.' },
      { punt: 'Torso stays still', uitleg: 'Only your arms and shoulders move. Your torso and hips stay still.' },
      { punt: 'Switch direction', uitleg: 'Circle one way and then the other way in turns.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart.',
      'Hold the kettlebell upside down by the horns in front of your chest.',
    ],
    stappen: [
      'Bring the bell back along one side of your head.',
      'Circle it behind your head to the other side.',
      'Bring it back in front of your chest and circle the other way next time.',
    ],
    fouten: [
      { fout: 'Torso rotates along', beter: 'Brace your core and choose a lighter bell.' },
      { fout: 'Circle too big', beter: 'Keep the bell close to your head.' },
    ],
    ademhaling: 'Breathe calmly, out as the bell passes behind your head.',
    tempo: 'About 3 counts per circle.',
    makkelijker: 'Choose a lighter bell or do it seated.',
    zwaarder: 'Choose a heavier bell or do it half kneeling.',
  },
  'Cossack squat': {
    kernpunten: [
      { punt: 'Heel stays down', uitleg: 'The heel of your bent leg stays flat on the floor. That way you sink in safely.' },
      { punt: 'Other leg straight', uitleg: 'Your other leg is straight with your toes up. You feel the stretch on the inside.' },
      { punt: 'As deep as your hip allows', uitleg: 'Do not go deeper than you can with a straight back. It gets deeper over time.' },
    ],
    opstelling: [
      'Stand very wide with your toes turned out a little.',
      'Hold your hands together in front of your chest.',
    ],
    stappen: [
      'Sink to one side by bending that leg.',
      'Your other leg straightens with your toes up.',
      'Push back to the middle and sink to the other side.',
    ],
    fouten: [
      { fout: 'Heel lifts', beter: 'Go less deep or bring your feet a little closer.' },
      { fout: 'Back rounds', beter: 'Chest up and hands in front of your chest.' },
    ],
    ademhaling: 'Breathe in as you sink and out as you come up.',
    tempo: '2 counts to the side, 1 count back.',
    makkelijker: 'Hold on to a post or go less deep.',
    zwaarder: 'Hold a kettlebell in front of your chest.',
  },
  'Curtsy lunge': {
    kernpunten: [
      { punt: 'Foot back at an angle', uitleg: 'Your back foot crosses at an angle behind your standing leg. That makes the side of your glute work.' },
      { punt: 'Hips face forward', uitleg: 'Your hips keep facing forward. They do not rotate with your leg.' },
      { punt: 'Knee over your foot', uitleg: 'Your front knee points the same way as your toes.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart.',
      'Keep your hands on your hips or in front of your chest.',
    ],
    stappen: [
      'Step one foot back at an angle behind your other leg.',
      'Lower until your back knee almost touches the floor.',
      'Push back up and bring your foot next to the other.',
    ],
    fouten: [
      { fout: 'Hips rotate along', beter: 'Keep your hips facing forward. Cross your foot over less.' },
      { fout: 'Front knee caves in', beter: 'Push your knee out above your foot.' },
    ],
    ademhaling: 'Breathe in as you lower and out as you come up.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Hold on to a wall or go less deep.',
    zwaarder: 'Hold a dumbbell in each hand.',
  },
  'Pistol squat naar een bank': {
    kernpunten: [
      { punt: 'Heel on the floor', uitleg: 'The heel of your standing leg stays on the floor the whole movement.' },
      { punt: 'Sit with control', uitleg: 'You lower slowly onto the bench, no dropping. Sit briefly and come back up.' },
      { punt: 'Arms forward', uitleg: 'Keeping your arms forward helps your balance.' },
    ],
    opstelling: [
      'Place a bench behind you and stand on one leg in front of it.',
      'Extend your other leg forward a little above the floor.',
    ],
    stappen: [
      'Lower on your standing leg until you sit briefly on the bench.',
      'Keep your free leg straight in front of you.',
      'Push back up on the same leg.',
    ],
    fouten: [
      { fout: 'Dropping onto the bench', beter: 'Lower more slowly or choose a higher bench.' },
      { fout: 'Knee caves in', beter: 'Keep your knee above your foot. Choose a higher bench.' },
    ],
    ademhaling: 'Breathe in as you lower and out as you come up.',
    tempo: '3 counts down, sit briefly, 1 count up.',
    makkelijker: 'Choose a higher bench or hold on to a post.',
    zwaarder: 'Choose a lower bench or hold a kettlebell in front of your chest.',
  },
  'Step-down': {
    kernpunten: [
      { punt: 'Lower slowly', uitleg: 'Your standing leg bends slowly. The work is in the way down.' },
      { punt: 'Knee over your foot', uitleg: 'Your knee stays above your foot and does not cave in.' },
      { punt: 'Only tap', uitleg: 'Your other heel only taps the floor. You put no weight on it.' },
    ],
    opstelling: [
      'Stand with one leg on a box, your other foot hanging next to the box.',
      'Keep your hands on your hips or in front of your chest.',
    ],
    stappen: [
      'Bend your standing leg slowly until your other heel taps the floor.',
      'Push back up through your standing leg.',
      'Do all reps and then switch legs.',
    ],
    fouten: [
      { fout: 'Knee caves in', beter: 'Choose a lower box and push your knee out.' },
      { fout: 'Weight on the foot on the floor', beter: 'Only tap and come straight back up.' },
    ],
    ademhaling: 'Breathe in as you lower and out as you come up.',
    tempo: '3 counts down, 1 count up.',
    makkelijker: 'Choose a lower box.',
    zwaarder: 'Choose a higher box or hold dumbbells.',
  },
  'Calf raise op een been': {
    kernpunten: [
      { punt: 'As high as you can', uitleg: 'Push all the way up onto your toes. Hold briefly at the top.' },
      { punt: 'Weight on your big toe', uitleg: 'Your ankle does not roll out. Your weight stays on the inside of your foot.' },
      { punt: 'Slowly down', uitleg: 'Lower calmly until your heel is just above the floor.' },
    ],
    opstelling: [
      'Stand on one leg with one hand against the wall for balance.',
      'Lift your other foot a little.',
    ],
    stappen: [
      'Push up onto your toes as high as you can.',
      'Hold briefly at the top.',
      'Lower slowly and switch legs after the set.',
    ],
    fouten: [
      { fout: 'Ankle rolls out', beter: 'Push up through your big toe.' },
      { fout: 'Too fast and too small', beter: 'Use the whole movement and go slowly.' },
    ],
    ademhaling: 'Breathe out as you push up and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Do it on two legs.',
    zwaarder: 'Stand with the ball of your foot on a step or hold a dumbbell.',
  },
  'Tibialis raise': {
    kernpunten: [
      { punt: 'Heels on the floor', uitleg: 'Your heels stay on the floor. Only your toes and forefoot lift.' },
      { punt: 'Legs straight', uitleg: 'Your legs stay straight and your back against the wall.' },
      { punt: 'Distance sets the load', uitleg: 'The further your feet are from the wall, the harder it gets.' },
    ],
    opstelling: [
      'Lean with your back against a wall.',
      'Step your feet forward, hip width apart.',
    ],
    stappen: [
      'Lift your toes as high as you can.',
      'Hold briefly.',
      'Lower your feet slowly.',
    ],
    fouten: [
      { fout: 'Knees bend', beter: 'Keep your legs straight. Bring your feet closer to the wall.' },
      { fout: 'Moving too little', beter: 'Lift your toes as high as you can.' },
    ],
    ademhaling: 'Breathe calmly.',
    tempo: '1 count up, 1 count hold, 1 count down.',
    makkelijker: 'Bring your feet closer to the wall.',
    zwaarder: 'Move your feet further from the wall or do one leg at a time.',
  },
  'Wall slide': {
    kernpunten: [
      { punt: 'Everything on the wall', uitleg: 'Your lower back, elbows and hands stay against the wall.' },
      { punt: 'From W to Y', uitleg: 'Your arms start in a W and slide up into a Y.' },
      { punt: 'Only as high as you can', uitleg: 'If something comes off the wall, stop there. Your range grows over time.' },
    ],
    opstelling: [
      'Stand with your back against the wall and your feet a small step away from it.',
      'Place your arms against the wall in a W with your elbows at shoulder height.',
    ],
    stappen: [
      'Slide your arms slowly up into a Y.',
      'Hold briefly without anything coming off the wall.',
      'Slide them calmly back to the W.',
    ],
    fouten: [
      { fout: 'Lower back comes off', beter: 'Brace your core and go less high.' },
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down as you slide.' },
    ],
    ademhaling: 'Breathe out as you slide up and in as you come back.',
    tempo: '3 counts up, 3 counts down.',
    makkelijker: 'Do it lying on your back on the floor.',
    zwaarder: 'Hold the Y for 3 counts.',
  },
  'Jumping jack': {
    kernpunten: [
      { punt: 'Land softly', uitleg: 'Land on the balls of your feet with slightly bent knees. That cushions the landing.' },
      { punt: 'Steady rhythm', uitleg: 'Jump at a steady pace. Not too high, but keep going.' },
      { punt: 'Arms all the way up', uitleg: 'Your arms go overhead and back down by your sides.' },
    ],
    opstelling: [
      'Stand tall with your feet together and your arms by your sides.',
    ],
    stappen: [
      'Jump into a wide stance while your arms go overhead.',
      'Jump back to feet together and arms by your sides.',
      'Keep going at a steady rhythm.',
    ],
    fouten: [
      { fout: 'Landing hard on your heels', beter: 'Stay on the balls of your feet and bend your knees a little.' },
      { fout: 'Arms only half up', beter: 'Bring your arms all the way overhead.' },
    ],
    ademhaling: 'Breathe in and out calmly at your own rhythm.',
    tempo: 'About one jump per second, for time.',
    makkelijker: 'Step out to the side in turns instead of jumping.',
    zwaarder: 'Jump faster or drop into a small squat on every landing.',
  },
  'High knees': {
    kernpunten: [
      { punt: 'On the balls of your feet', uitleg: 'You land on the balls of your feet and stay light. Your heels barely touch the floor.' },
      { punt: 'Knees to hip height', uitleg: 'Drive your knees as high as you can, ideally to hip height.' },
      { punt: 'Torso upright', uitleg: 'Do not lean back. Your torso stays upright and your arms move along.' },
    ],
    opstelling: [
      'Stand tall with your feet hip width apart and your arms bent like when running.',
    ],
    stappen: [
      'Run on the spot and drive your knees up high in turns.',
      'Move your arms along like when running.',
      'Keep the pace until the time is up.',
    ],
    fouten: [
      { fout: 'Leaning back', beter: 'Keep your torso upright and brace your core.' },
      { fout: 'Knees too low', beter: 'Rather go a bit slower with high knees.' },
    ],
    ademhaling: 'Breathe calmly and rhythmically.',
    tempo: 'Fast, for time.',
    makkelijker: 'March on the spot with high knees.',
    zwaarder: 'Go faster or do shorter blocks at full pace.',
  },
  'Skater jump': {
    kernpunten: [
      { punt: 'Land softly', uitleg: 'Land on a bent leg and cushion your landing. Your knee stays above your foot.' },
      { punt: 'Back foot floats', uitleg: 'Your other foot swings behind you without touching the floor.' },
      { punt: 'Stable first, then far', uitleg: 'Start with short jumps and only jump further once you can land still.' },
    ],
    opstelling: [
      'Stand on one leg with a slight knee bend.',
      'Keep your torso leaning slightly forward and your arms loose.',
    ],
    stappen: [
      'Jump sideways onto your other leg.',
      'Land softly with a bent knee and let your other foot swing behind you.',
      'Jump straight back to the other side.',
    ],
    fouten: [
      { fout: 'Knee caves in on landing', beter: 'Jump shorter and push your knee above your foot.' },
      { fout: 'Landing hard', beter: 'Land on the ball of your foot and bend your knee.' },
    ],
    ademhaling: 'Breathe calmly and rhythmically.',
    tempo: 'Smooth from side to side, for time.',
    makkelijker: 'Step to the side instead of jumping.',
    zwaarder: 'Jump further and hold every landing for one count.',
  },
  'Broad jump': {
    kernpunten: [
      { punt: 'Swing your arms', uitleg: 'Swing your arms back and then hard forward. That gives extra distance.' },
      { punt: 'Land softly', uitleg: 'Land on both feet with bent knees and cushion the landing.' },
      { punt: 'Knees over your feet', uitleg: 'On take off and landing your knees stay above your feet.' },
    ],
    opstelling: [
      'Stand with your feet hip width apart.',
      'Keep your arms loose by your sides.',
    ],
    stappen: [
      'Swing your arms back and dip a little through your knees.',
      'Jump forward as far as you can while your arms swing forward.',
      'Land softly on both feet, stand still and walk back for the next jump.',
    ],
    fouten: [
      { fout: 'Landing with straight legs', beter: 'Bend your knees on landing and sink in a little.' },
      { fout: 'Knees cave in', beter: 'Jump less far and push your knees out.' },
    ],
    ademhaling: 'Breathe in before the jump and out on the landing.',
    tempo: 'One jump, land still, walk back calmly.',
    makkelijker: 'Choose the squat jump on the spot.',
    zwaarder: 'Do three jumps in a row.',
  },
}
