// De coaching van de oefeningen die de website laat zien (voorbeeldschema, blikvanger,
// held en de oefenkaart). Het Nederlands komt rechtstreeks uit de oefenbibliotheek van
// Club (src/lib/club/training/coaching): niets is voor de website herschreven. Het
// Engels zegt precies hetzelfde. De live demo toont de Voorbeeld Gym en blijft
// Nederlands (dat staat er eerlijk bij, zie demo.ts).
// Een nieuwe oefening op de website krijgt hier ook Engels; coaching.test.ts dwingt dat af.

import { coachingVoor } from '@/lib/club/training/coaching'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import type { Taal } from '../../taal'
import { woordenboek, type Vorm } from '../../woordenboek'

/** Coaching om te tonen (alleen lezen), in een taal. */
export type SiteCoachingTekst = Vorm<Coaching>

/** De coaching uit de bibliotheek; een oefening zonder coaching is een fout in de website. */
function uitBibliotheek(naam: string): Coaching {
  const coaching = coachingVoor(naam)
  if (!coaching) throw new Error(`Geen coaching in de bibliotheek voor ${naam}`)
  return coaching
}

export const SITE_COACHING = woordenboek({
  nl: {
    'Front squat': uitBibliotheek('Front squat'),
    'Back squat': uitBibliotheek('Back squat'),
    Deadlift: uitBibliotheek('Deadlift'),
    'Push-up': uitBibliotheek('Push-up'),
    'Barbell row': uitBibliotheek('Barbell row'),
  },
  en: {
    'Front squat': {
      kernpunten: [
        { punt: 'Elbows high', uitleg: 'Your upper arms point almost horizontally forward. If your elbows drop, the bar rolls off your shoulders.' },
        { punt: 'Bar rests on your shoulders', uitleg: 'The bar rests on the front of your shoulders. Your fingers only keep it in place.' },
        { punt: 'Torso upright', uitleg: 'Your chest stays up and you sink straight down between your heels. You feel it mostly in the front of your thighs.' },
        { punt: 'Knees may travel forward', uitleg: 'In a front squat your knees move forward over your toes. That is normal, as long as your heels stay on the floor.' },
      ],
      opstelling: [
        'Set the rack at chest height and the safety bars just below your lowest point.',
        'Rest the bar on the front of your shoulders close to your throat, fingers under the bar just outside shoulder width, elbows high.',
        'Step out of the rack and place your feet shoulder width apart, toes turned slightly out.',
      ],
      stappen: [
        'Breathe in and brace your core.',
        'Sink straight down and keep your elbows up.',
        'Push the floor away and stand up tall, with your elbows leading the way up.',
      ],
      fouten: [
        { fout: 'Elbows drop at the bottom', beter: 'Think elbows to the ceiling as you stand up. If it is too heavy, use a lighter weight.' },
        { fout: 'Wrists hurt', beter: 'Hold the bar with fewer fingers, or cross your arms over the bar until your wrists are more supple.' },
        { fout: 'Heels lift', beter: 'Work on your ankle mobility or put your heels on a small raise, such as a thin plate.' },
      ],
      ademhaling: 'Breathe in and hold it on the way down, breathe out at the top.',
      tempo: '2 to 3 counts down, a short pause, drive up hard.',
      makkelijker: 'Practise the goblet squat first: the same position, with less demand on your wrists.',
      zwaarder: 'Pause for 2 counts at the bottom before you come up.',
    },
    'Back squat': {
      kernpunten: [
        { punt: 'Bar on your upper back', uitleg: 'The bar sits on the muscles below your neck, not on your spine. Grip the bar firmly, elbows down.' },
        { punt: 'Brace your core', uitleg: 'Breathe in and lock your torso as if someone is about to poke your belly. That keeps your back neutral under the bar.' },
        { punt: 'Weight on your midfoot', uitleg: 'Your whole foot stays on the floor. Heel and big toe keep contact, you are not on your toes.' },
        { punt: 'Knees follow your toes', uitleg: 'Push your knees out in the direction of your toes, they do not cave in.' },
        { punt: 'Chest up as you stand', uitleg: 'Hips and shoulders rise together. Your hips do not shoot up first.' },
      ],
      opstelling: [
        'Set the rack so the bar is at chest height and the safety bars are just below your lowest point.',
        'Step under the bar, lift it out of the rack and take 2 or 3 steps back. Feet shoulder width apart, toes turned slightly out.',
      ],
      stappen: [
        'Take a deep breath and brace your core.',
        'Sink by bending your hips and knees at the same time until your hips are roughly at knee height.',
        'Push the floor away with your whole foot and stand straight up.',
        'Breathe out at the top and brace again before the next rep.',
      ],
      fouten: [
        { fout: 'Heels lift off the floor', beter: 'Sit back more and keep your weight on your midfoot. Work on your ankle mobility if needed.' },
        { fout: 'Knees cave in as you stand', beter: 'Actively push your knees out, in line with your toes. If you cannot, the weight is too heavy.' },
        { fout: 'Lower back rounds at the bottom', beter: 'Only go as deep as your back stays neutral, and brace your core harder before every rep.' },
        { fout: 'Hips shoot up first', beter: 'Think chest and hips up together. Your torso angle stays the same until you are almost upright.' },
      ],
      ademhaling: 'Breathe in and hold it on the way down, breathe out when you are nearly at the top.',
      tempo: '2 to 3 counts down, no bounce, drive up hard.',
      makkelijker: 'Learn the goblet squat or the squat in the Smith machine first.',
      zwaarder: 'Pause for 2 counts at the bottom before you drive up (pause squat).',
    },
    Deadlift: {
      kernpunten: [
        { punt: 'Bar over your midfoot', uitleg: 'Seen from above, the bar runs over the middle of your foot. That way you pull up in a straight line.' },
        { punt: 'Flat back, proud chest', uitleg: 'Your back stays neutral from start to finish, neither arched nor rounded. Look at the floor a few metres ahead.' },
        { punt: 'Tension before you pull', uitleg: 'Pull the bar tight against the plates until there is no slack left. Only then push the floor away.' },
        { punt: 'Bar along your legs', uitleg: 'The bar slides up along your shins and thighs. That keeps the load close to your body.' },
        { punt: 'Tall at the top, no arch', uitleg: 'Finish with your hips extended and your glutes squeezed. Do not lean back.' },
      ],
      opstelling: [
        'Stand with your feet hip width apart and the bar over your midfoot.',
        'Bend forward and grip the bar just outside your knees. Let your shins touch the bar without pushing it away.',
        'Straighten your arms and engage your lats, as if you are pulling your armpits towards your hips.',
      ],
      stappen: [
        'Take a deep breath, brace your core and take the slack out of the bar.',
        'Push the floor away with your legs, keeping the bar against your legs.',
        'Once the bar passes your knees, drive your hips forward until you stand tall.',
        'Lower the bar by pushing your hips back first and then bending your knees.',
      ],
      fouten: [
        { fout: 'Lower back rounds', beter: 'Set your back again before every rep. If you cannot with this weight, go lighter.' },
        { fout: 'Bar drifts away from your legs', beter: 'Pull the bar towards you and keep it against your legs. Long trousers or socks help.' },
        { fout: 'Jerking the bar', beter: 'Build tension first, then lift. The start is a firm push, not a jerk.' },
        { fout: 'Hips shoot up first', beter: 'Hips and shoulders rise together. Start by pushing with your legs, not by pulling with your back.' },
      ],
      ademhaling: 'Breathe in and hold it before you pull, breathe out at the top or back on the floor.',
      tempo: 'Controlled on the way up, 2 counts down, rebuild every rep.',
      makkelijker: 'Start with a kettlebell deadlift, or put the bar on blocks so it sits higher.',
      zwaarder: 'Add weight in small steps as long as your back stays neutral.',
    },
    'Push-up': {
      kernpunten: [
        { punt: 'Body like a plank', uitleg: 'A straight line from head to heels. Brace your core and glutes so your hips do not sag.' },
        { punt: 'Elbows angled back', uitleg: 'Your elbows point back at about 45 degrees, not wide to the side. That is kinder to your shoulders.' },
        { punt: 'Hands just outside shoulders', uitleg: 'Place your hands slightly wider than your shoulders, fingers forward. Your shoulders are over or just ahead of your hands.' },
        { punt: 'Chest to just above the floor', uitleg: 'Lower until your chest almost touches the floor. One full rep counts for more than many half ones.' },
      ],
      opstelling: [
        'Place your hands on the floor slightly wider than your shoulders and stretch your legs back onto your toes.',
        'Brace your core and glutes so you form a straight line, and look at the floor just ahead of your hands.',
      ],
      stappen: [
        'Lower as one unit by bending your elbows.',
        'Stop when your chest is just above the floor.',
        'Push yourself up until your arms are straight, keeping your body in line.',
      ],
      fouten: [
        { fout: 'Hips sag', beter: 'Squeeze your glutes and core. If your hips still sag, do push-ups on your knees or with your hands raised.' },
        { fout: 'Elbows flare wide', beter: 'Turn your elbows back at an angle. Think of an arrow, not a T.' },
        { fout: 'Head drops towards the floor', beter: 'Keep your neck in line with your back. Your chin does not lead the way down.' },
        { fout: 'Half reps', beter: 'Lower until your chest almost touches the floor. If you cannot, choose an easier variation.' },
      ],
      ademhaling: 'Breathe in as you lower and breathe out as you push up.',
      tempo: '2 counts down, a short pause, 1 count up.',
      makkelijker: 'Put your hands on a bench, or do the push-up on your knees.',
      zwaarder: 'Put your feet on a bench, or make the lowering phase last 4 counts.',
    },
    'Barbell row': {
      kernpunten: [
        { punt: 'Flat back, core braced', uitleg: 'Your lower back stays neutral from tailbone to neck. Brace your core as if you are about to take a punch.' },
        { punt: 'Hinge at the hips', uitleg: 'Push your hips back until your torso is at an angle. You feel a stretch in the back of your thighs.' },
        { punt: 'Pull to your navel', uitleg: 'The bar travels to your lower ribs or navel. Your elbows move back at an angle along your body.' },
        { punt: 'Torso stays still', uitleg: 'Your torso keeps the same angle. If you come up to move the weight, it is too heavy.' },
      ],
      opstelling: [
        'Stand with your feet hip width apart and grip the bar just outside your legs, palms facing you.',
        'Knees slightly bent, hips back until your torso is at about 45 degrees or lower.',
      ],
      stappen: [
        'Let the bar hang with straight arms below your shoulders.',
        'Pull the bar to your navel and squeeze your shoulder blades together.',
        'Lower the bar under control until your arms are straight again, without moving your back.',
      ],
      fouten: [
        { fout: 'Lower back rounds', beter: 'Use less weight, chest slightly forward and core braced. If your back still will not stay flat, choose the chest-supported row.' },
        { fout: 'Bar far in front of your body', beter: 'Keep the bar close to your legs and pull it to your navel. Far in front of you it pulls on your lower back.' },
        { fout: 'Heaving with your whole torso', beter: 'Every rep starts still. Pull with your elbows, not with a swing from your hips.' },
      ],
      ademhaling: 'Breathe in and brace before you pull, breathe out when the bar reaches your stomach.',
      tempo: '1 count up, a short pause, 2 counts down.',
      makkelijker: 'Do the row on an incline bench so the bench supports your torso.',
      zwaarder: 'Hold for 2 counts at the top with your shoulder blades together.',
    },
  },
})

/** De oefeningen waarvan de website de coaching in beide talen heeft. */
export const SITE_COACHING_NAMEN: readonly string[] = Object.keys(SITE_COACHING.nl)

/**
 * De coaching van een oefening op de website, in een taal. Nederlands komt altijd
 * uit de bibliotheek; Engels alleen voor de oefeningen in SITE_COACHING (de test
 * zorgt dat elke oefening op de website erin staat).
 */
export function siteCoaching(naam: string, taal: Taal): SiteCoachingTekst | undefined {
  if (taal === 'nl') return coachingVoor(naam) ?? undefined
  const boek: Readonly<Record<string, SiteCoachingTekst | undefined>> = SITE_COACHING.en
  return boek[naam]
}
