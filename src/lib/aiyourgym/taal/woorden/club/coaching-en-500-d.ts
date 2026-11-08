// Engelse coaching van de uitbreiding van migratie 500, deel D (kabel, stang,
// elastiek en landmine). Het Nederlands (coaching/uitbreiding-500-d.ts) is de bron.

import type { Coaching } from '@/lib/club/training/coaching/typen'

export const COACHING_EN_500_D: Readonly<Record<string, Coaching>> = {
  'Cable fly van laag naar hoog': {
    kernpunten: [
      { punt: 'Fixed slight bend', uitleg: 'Your elbows keep the same slight bend the whole movement. Your arms do not straighten or bend.' },
      { punt: 'Arc upwards', uitleg: 'Your hands travel in an arc from low next to your hips up to in front of your upper chest.' },
      { punt: 'Chest open', uitleg: 'Your chest stays open and your shoulders down. That works mostly the upper part of your chest.' },
    ],
    opstelling: [
      'Set both cables to the lowest position and take a handle in each hand.',
      'Step a small pace forward between the towers, your feet side by side at shoulder width.',
    ],
    stappen: [
      'Start with your arms low and wide next to your hips, palms angled down.',
      'Bring your hands up in an arc until they meet in front of your upper chest.',
      'Lower them calmly along the same arc.',
    ],
    fouten: [
      { fout: 'Arms bend and press', beter: 'Hold the bend in your elbows. It is an arc, not a press.' },
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down and stop at shoulder height.' },
    ],
    ademhaling: 'Breathe out as you bring the handles up and in as you lower them.',
    tempo: '1 count up, 1 count hold, 2 counts back.',
    makkelijker: 'Use less weight or do one arm at a time.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Cable fly van hoog naar laag': {
    kernpunten: [
      { punt: 'Lean slightly forward', uitleg: 'Your torso leans slightly forward and stays still. That gives the cables a clean line.' },
      { punt: 'Fixed slight bend', uitleg: 'Your elbows keep the same slight bend. The work comes from your chest.' },
      { punt: 'Hands in front of your hips', uitleg: 'Your hands meet in front of your hips at the bottom.' },
    ],
    opstelling: [
      'Set both cables high and take a handle in each hand.',
      'Step forward, your feet side by side at shoulder width, and lean slightly forward.',
    ],
    stappen: [
      'Start with your arms high and wide to the sides.',
      'Bring your hands down in an arc until they meet in front of your hips.',
      'Let them rise calmly until you feel a stretch in your chest.',
    ],
    fouten: [
      { fout: 'Torso moves along', beter: 'Set your feet more firmly and use less weight.' },
      { fout: 'Arms press downwards', beter: 'Hold the bend in your elbows. It is an arc.' },
    ],
    ademhaling: 'Breathe out as you bring the handles down and in as they come back.',
    tempo: '1 count down, 1 count hold, 2 counts back.',
    makkelijker: 'Use less weight or do one arm at a time.',
    zwaarder: 'Hold at the bottom for 2 counts.',
  },
  'Front raise aan de kabel': {
    kernpunten: [
      { punt: 'No swinging', uitleg: 'Your torso stays still. If you swing, the weight is too heavy.' },
      { punt: 'To shoulder height', uitleg: 'Raise your arms to shoulder height. Higher adds little.' },
      { punt: 'Arms almost straight', uitleg: 'Your elbows are slightly bent and stay that way.' },
    ],
    opstelling: [
      'Set the cable low with a straight bar and stand with your back to the tower.',
      'Let the cable run between your legs and grip the bar overhand.',
    ],
    stappen: [
      'Raise your arms in front of you to shoulder height.',
      'Hold briefly.',
      'Lower the bar calmly to your thighs.',
    ],
    fouten: [
      { fout: 'Torso leans back', beter: 'Use less weight and brace your core.' },
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down as you raise.' },
    ],
    ademhaling: 'Breathe out as you raise and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose the dumbbell front raise with less weight.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Reverse fly aan de kabel': {
    kernpunten: [
      { punt: 'Cables crossed', uitleg: 'Your left hand takes the right cable and the other way around. That lets you pull wide and back.' },
      { punt: 'Shoulders down', uitleg: 'Do not shrug your shoulders. The work sits at the back of your shoulders.' },
      { punt: 'Arms slightly bent', uitleg: 'Your elbows are slightly bent and stay at that angle.' },
    ],
    opstelling: [
      'Set both cables at shoulder height and stand in the middle, about a metre from the towers and facing them.',
      'Take the right cable with your left hand and the left cable with your right hand, arms crossed in front of you.',
    ],
    stappen: [
      'Pull your arms wide and back until they are in line with your shoulders.',
      'Hold briefly.',
      'Let your arms cross calmly in front of your chest again.',
    ],
    fouten: [
      { fout: 'Shoulders shrug up', beter: 'Push your shoulders down and use less weight.' },
      { fout: 'Torso leans back', beter: 'Stand tall and brace your core.' },
    ],
    ademhaling: 'Breathe out as you pull apart and in as you come back.',
    tempo: '1 count open, 1 count hold, 2 counts back.',
    makkelijker: 'Choose the band pull-apart.',
    zwaarder: 'Hold the open position for 2 counts.',
  },
  'Triceps pushdown met een arm': {
    kernpunten: [
      { punt: 'Elbow stays in place', uitleg: 'Your elbow stays against your side. Only your forearm moves.' },
      { punt: 'Straighten fully', uitleg: 'Straighten your arm fully at the bottom and squeeze your triceps briefly.' },
      { punt: 'Back calmly', uitleg: 'Let the handle come back calmly until your forearm is just above horizontal.' },
    ],
    opstelling: [
      'Set the cable high with a D handle.',
      'Stand facing the tower with the handle in one hand and your elbow against your side. Your other hand rests on your hip.',
    ],
    stappen: [
      'Push the handle down until your arm is straight.',
      'Squeeze briefly.',
      'Let the handle come back calmly and then do the other arm.',
    ],
    fouten: [
      { fout: 'Elbow moves forward', beter: 'Keep your elbow against your side. Use less weight.' },
      { fout: 'Leaning on the handle', beter: 'Stand tall. Your torso does not help.' },
    ],
    ademhaling: 'Breathe out as you push down and in as you come back.',
    tempo: '1 count down, 1 count hold, 2 counts back.',
    makkelijker: 'Choose the triceps pushdown with two hands.',
    zwaarder: 'Hold at the bottom for 2 counts.',
  },
  'Bayesian curl aan de kabel': {
    kernpunten: [
      { punt: 'Elbow behind your torso', uitleg: 'Your arm starts slightly behind your body. That puts your biceps on stretch at the bottom.' },
      { punt: 'Elbow stays still', uitleg: 'Your elbow does not move forward as you curl.' },
      { punt: 'Half a step forward', uitleg: 'Step half a pace away from the tower. Then there is tension at the bottom.' },
    ],
    opstelling: [
      'Set the cable low with a D handle and stand with your back to the tower.',
      'Grip the handle with one hand and step half a pace forward, your arm slightly behind you. Your other hand rests on your hip.',
    ],
    stappen: [
      'Curl the handle up until your forearm is about horizontal.',
      'Squeeze briefly at the top.',
      'Lower the handle calmly until your arm hangs behind you again and then do the other arm.',
    ],
    fouten: [
      { fout: 'Elbow shoots forward', beter: 'Keep your elbow behind your torso. Use less weight.' },
      { fout: 'Torso rotates along', beter: 'Stand firmly on your feet and keep your shoulders square.' },
    ],
    ademhaling: 'Breathe out as you curl up and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose the cable curl with two hands.',
    zwaarder: 'Lower over 3 counts and pause for one count at the bottom.',
  },
  'Woodchop aan de kabel': {
    kernpunten: [
      { punt: 'Rotate from torso and hips', uitleg: 'The movement comes from your torso and hips. Your arms keep the same bend and only guide.' },
      { punt: 'Feet wide and still', uitleg: 'Your feet stay wide on the floor and your knees bend slightly along. That lets your hips rotate.' },
      { punt: 'Back with control', uitleg: 'Let the cable come back calmly. You do not let it pull you back.' },
    ],
    opstelling: [
      'Set the cable high and stand side on next to it with your feet wider than your shoulders.',
      'Grip the handle with both hands above your shoulder.',
    ],
    stappen: [
      'Pull the handle diagonally down across your body to in front of your opposite hip.',
      'Rotate your torso and hips along and bend your knees slightly.',
      'Let the handle rise calmly and then do the other side.',
    ],
    fouten: [
      { fout: 'Pulling with the arms', beter: 'Keep your elbows at the same angle and rotate from your torso.' },
      { fout: 'Knees locked', beter: 'Bend your knees slightly, then your hips can rotate along.' },
    ],
    ademhaling: 'Breathe out as you pull down and in as you come back.',
    tempo: '1 count down, 2 counts back.',
    makkelijker: 'Use less weight and a smaller rotation.',
    zwaarder: 'Do it half kneeling so your hips help less.',
  },
  'Eenarmige seated cable row': {
    kernpunten: [
      { punt: 'Torso does not rotate', uitleg: 'Your shoulders keep facing forward. Your torso only tilts a little, from slightly forward to upright.' },
      { punt: 'Elbow along your body', uitleg: 'Pull the handle to your side with your elbow close to your torso.' },
      { punt: 'Shoulder blade back', uitleg: 'At the end you pull your shoulder blade back. That is where you feel your back.' },
    ],
    opstelling: [
      'Sit at the row station with your feet against the plate and your knees slightly bent.',
      'Grip a D handle with one hand. Your other hand rests on your thigh.',
    ],
    stappen: [
      'Start slightly forward with a long arm and pull the handle to your side until you sit upright.',
      'Pull your shoulder blade back and hold briefly.',
      'Let your arm straighten calmly and then do the other arm.',
    ],
    fouten: [
      { fout: 'Torso rotates along', beter: 'Use less weight and keep your shoulders square.' },
      { fout: 'Leaning back', beter: 'Stop when you sit upright. Going further back does not help.' },
    ],
    ademhaling: 'Breathe out as you pull and in as you come back.',
    tempo: '1 count pull, 1 count hold, 2 counts back.',
    makkelijker: 'Choose the seated cable row with two hands.',
    zwaarder: 'Hold the end position for 2 counts.',
  },
  'Lat pulldown met brede greep': {
    kernpunten: [
      { punt: 'Chest up', uitleg: 'Your chest moves towards the bar. That way you pull with your back and not your arms.' },
      { punt: 'Elbows down and out', uitleg: 'Think of pulling your elbows to your hips. The bar follows.' },
      { punt: 'Do not lean far back', uitleg: 'Lean back only a little. Your torso stays still.' },
    ],
    opstelling: [
      'Sit at the lat station with your knees under the pads.',
      'Grip the bar very wide overhand.',
    ],
    stappen: [
      'Pull the bar to your upper chest.',
      'Hold briefly with your shoulder blades down.',
      'Let the bar rise under control until your arms are straight.',
    ],
    fouten: [
      { fout: 'Leaning far back', beter: 'Use less weight and sit tall.' },
      { fout: 'Bar behind your neck', beter: 'Always pull the bar in front of you to your chest.' },
    ],
    ademhaling: 'Breathe out as you pull and in as you come back.',
    tempo: '1 count down, 1 count hold, 2 counts up.',
    makkelijker: 'Choose the lat pulldown with a normal grip.',
    zwaarder: 'Hold at the bottom for 2 counts.',
  },
  'Hanging leg raise': {
    kernpunten: [
      { punt: 'No swinging', uitleg: 'Hang still before you start. Swinging takes the work away from your abs.' },
      { punt: 'Tilt your pelvis', uitleg: 'Tilt your pelvis towards you at the top. Then your abs work, not only your hip flexors.' },
      { punt: 'Slowly down', uitleg: 'Lower your legs slowly. Dropping them fast makes you swing.' },
    ],
    opstelling: [
      'Hang from the pull-up bar with your hands shoulder width apart and straight arms.',
      'Let your legs hang straight down.',
    ],
    stappen: [
      'Lift your straight legs to hip height or higher.',
      'Tilt your pelvis towards you at the top.',
      'Lower your legs slowly until you hang still again.',
    ],
    fouten: [
      { fout: 'Swinging the whole body', beter: 'Wait until you hang still and lower more slowly.' },
      { fout: 'Legs only halfway', beter: 'Bend your knees if you cannot reach hip height.' },
    ],
    ademhaling: 'Breathe out as you lift and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose the hanging knee raise.',
    zwaarder: 'Lift your feet all the way to the bar.',
  },
  'Scapula pull-up': {
    kernpunten: [
      { punt: 'Arms stay straight', uitleg: 'Your elbows do not bend. Only your shoulder blades move.' },
      { punt: 'Shoulders down', uitleg: 'Pull your shoulder blades down and together. You rise a few centimetres.' },
      { punt: 'Back calmly', uitleg: 'Let your shoulders rise calmly until you hang loose again.' },
    ],
    opstelling: [
      'Grip the pull-up bar at shoulder width and hang with straight arms.',
    ],
    stappen: [
      'Pull your shoulder blades down and together.',
      'Hold briefly.',
      'Let your shoulders rise calmly again.',
    ],
    fouten: [
      { fout: 'Elbows bend', beter: 'Keep your arms straight. It is a small movement.' },
      { fout: 'Swinging', beter: 'Hang still first and only then start moving.' },
    ],
    ademhaling: 'Breathe out as you pull down and in as you come back.',
    tempo: '1 count down, 2 counts hold, 1 count back.',
    makkelijker: 'Let your toes touch the floor or use a band.',
    zwaarder: 'Hold the position for 3 counts.',
  },
  'Dead hang': {
    kernpunten: [
      { punt: 'Shoulders slightly active', uitleg: 'Do not let your shoulders sink all the way into your ears. Keep them slightly active.' },
      { punt: 'Hang still', uitleg: 'Hang still without swinging and breathe calmly.' },
      { punt: 'Step off calmly', uitleg: 'Step off under control. Do not drop.' },
    ],
    opstelling: [
      'Grip the pull-up bar overhand at shoulder width.',
      'Hang with straight arms and your feet off the floor.',
    ],
    stappen: [
      'Hang still with straight arms.',
      'Hold and breathe calmly.',
      'Step off calmly when the time is up.',
    ],
    fouten: [
      { fout: 'Shoulders sink in fully', beter: 'Pull your shoulders down a little.' },
      { fout: 'Holding your breath', beter: 'Breathe calmly.' },
    ],
    ademhaling: 'Breathe calmly and deeply.',
    tempo: 'Hold, for time.',
    makkelijker: 'Let your toes touch the floor.',
    zwaarder: 'Hang longer or from one hand at a time.',
  },
  'Clamshell met elastiek': {
    kernpunten: [
      { punt: 'Pelvis stays still', uitleg: 'Your pelvis does not roll back. Only your top knee opens.' },
      { punt: 'Feet together', uitleg: 'Your feet stay together the whole movement.' },
      { punt: 'Small movement', uitleg: 'Open your knee as far as you can without your pelvis rotating along.' },
    ],
    opstelling: [
      'Lie on your side with your knees bent and your head on your arm.',
      'Place a band just above your knees.',
    ],
    stappen: [
      'Open your top knee while your feet stay together.',
      'Hold briefly.',
      'Close your knee calmly and switch sides after the set.',
    ],
    fouten: [
      { fout: 'Pelvis rolls back', beter: 'Put your top hand on your hip and keep it still.' },
      { fout: 'Too fast', beter: 'Go slowly and hold for one count every time.' },
    ],
    ademhaling: 'Breathe out as you open and in as you close.',
    tempo: '1 count open, 1 count hold, 1 count closed.',
    makkelijker: 'Do it without a band.',
    zwaarder: 'Choose a heavier band.',
  },
  'Meadows row': {
    kernpunten: [
      { punt: 'Elbow wide and back', uitleg: 'Pull your elbow wide and high back. That brings your upper back into the work.' },
      { punt: 'Support on your knee', uitleg: 'Your free forearm rests on your front knee. That keeps your torso still.' },
      { punt: 'Long back', uitleg: 'Your back stays long and straight, even when it gets heavy.' },
    ],
    opstelling: [
      'Stand side on next to the end of a landmine bar in a split stance.',
      'Lean forward and grip the end of the bar overhand, your other forearm on your front knee.',
    ],
    stappen: [
      'Pull the bar up with your elbow wide and back.',
      'Hold briefly.',
      'Lower the bar calmly until your arm is straight and switch after the set.',
    ],
    fouten: [
      { fout: 'Torso rotates open', beter: 'Lean more firmly on your knee and use less weight.' },
      { fout: 'Back rounds', beter: 'Chest slightly forward and hips back.' },
    ],
    ademhaling: 'Breathe out as you pull and in as you lower.',
    tempo: '1 count up, 1 count hold, 2 counts down.',
    makkelijker: 'Choose the single arm dumbbell row.',
    zwaarder: 'Hold at the top for 2 counts.',
  },
  'Landmine rotatie': {
    kernpunten: [
      { punt: 'Arms stay long', uitleg: 'Your arms stay straight. The rotation comes from your torso and hips.' },
      { punt: 'Hips rotate along', uitleg: 'Your hips and feet rotate a little along. That keeps your lower back free.' },
      { punt: 'Calm and controlled', uitleg: 'Do not let the bar drop. You brake it on each side.' },
    ],
    opstelling: [
      'Stand in front of the end of a landmine bar with your feet slightly wider than your hips.',
      'Hold the end with both hands in front of you with straight arms.',
    ],
    stappen: [
      'Bring the bar in an arc to one hip.',
      'Bring it back up in front of you.',
      'Bring it in an arc to your other hip.',
    ],
    fouten: [
      { fout: 'Arms bend', beter: 'Keep your arms straight and use less weight.' },
      { fout: 'Bar drops down', beter: 'Brake the bar and go slower.' },
    ],
    ademhaling: 'Breathe out as you bring it down and in as you come up.',
    tempo: '2 counts to the side, 2 counts back.',
    makkelijker: 'Choose a smaller arc or an empty bar.',
    zwaarder: 'Add a plate to the bar.',
  },
  'Leg press met een been': {
    kernpunten: [
      { punt: 'Knee in line with your foot', uitleg: 'Your knee points the same way as your toes and does not cave in.' },
      { punt: 'Not locked out', uitleg: 'Straighten your leg almost fully at the top, but do not lock your knee.' },
      { punt: 'Half the weight', uitleg: 'Choose about half the weight you use with two legs.' },
    ],
    opstelling: [
      'Sit in the leg press with your back against the pad.',
      'Place one foot in the middle of the plate and let your other leg rest relaxed on the floor.',
    ],
    stappen: [
      'Lower the plate until your knee is at about a right angle.',
      'Push the plate away again from your heel.',
      'Do all reps and then switch legs.',
    ],
    fouten: [
      { fout: 'Knee caves in', beter: 'Use less weight and push your knee out.' },
      { fout: 'Hips lift off the pad', beter: 'Go less deep. Your lower back stays against the pad.' },
    ],
    ademhaling: 'Breathe in as you lower and out as you push away.',
    tempo: '2 counts down, 1 count up.',
    makkelijker: 'Choose the leg press with two legs.',
    zwaarder: 'Pause for 2 counts at the bottom.',
  },
}
