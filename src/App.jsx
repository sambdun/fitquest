import { useState, useEffect, useRef } from 'react'
import './App.css'

// ── Constants ────────────────────────────────────────────────
const XP_PER_WORKOUT = 400
const XP_PER_LEVEL   = 5600

const CATEGORIES = ['Strength', 'Cardio', 'Sports', 'Activities']

const CAT_ICONS = {
  Strength:   '💪',
  Cardio:     '🏃',
  Sports:     '🏅',
  Activities: '🧗',
}

const CAT_COLORS = {
  Strength:   { bar: '#89CFF0', soft: '#eef7fd' },
  Cardio:     { bar: '#7ecba1', soft: '#edfaf4' },
  Sports:     { bar: '#f0b97a', soft: '#fdf5eb' },
  Activities: { bar: '#b89cf0', soft: '#f5f0fd' },
}

// ── Muscle Tag Colors ─────────────────────────────────────────
const TAG_COLORS = {
  Chest:     { bg: '#fde8ea', text: '#b83347' },
  Back:      { bg: '#deeeff', text: '#1e5fa8' },
  Triceps:   { bg: '#ede8ff', text: '#6340c0' },
  Biceps:    { bg: '#fff0e0', text: '#b85e18' },
  Abs:       { bg: '#fdfce0', text: '#8a7910' },
  Legs:      { bg: '#e4f7e4', text: '#276227' },
  Shoulders: { bg: '#e0f7f5', text: '#1a7a72' },
}

// ── Beginner Guide Data ───────────────────────────────────────
const BEGINNER_GUIDE = {
  Strength: [
    // ── Chest ──────────────────────────────
    {
      name: 'Push-up',
      tags: ['Chest', 'Triceps'],
      volume: '3 sets × 8–12 reps',
      muscles: 'Chest · Shoulders · Triceps',
      desc: 'Start in a high plank. Lower your chest to the floor with control, then press back up, keeping your body in a straight line.',
      tip: 'Drop to your knees to modify. Focus on a tight core and full range of motion.',
    },
    {
      name: 'Incline Push-up',
      tags: ['Chest', 'Triceps'],
      volume: '3 sets × 12–15 reps',
      muscles: 'Chest · Shoulders · Triceps',
      desc: 'Place hands on a bench or elevated surface and perform a push-up. The incline reduces the load — perfect for building toward a full push-up.',
      tip: 'Use this as a stepping stone. As it gets easy, lower the surface height until you\'re on the floor.',
    },
    {
      name: 'Tricep Dip',
      tags: ['Triceps', 'Chest'],
      volume: '3 sets × 10–12 reps',
      muscles: 'Triceps · Chest · Shoulders',
      desc: 'Place hands on a bench or chair behind you, feet flat on the floor. Lower your body by bending your elbows, then press back up.',
      tip: 'Keep your back close to the bench and elbows pointing straight behind you — not flaring out.',
    },
    {
      name: 'Dumbbell Chest Press',
      tags: ['Chest', 'Triceps'],
      volume: '4 sets × 10 reps',
      muscles: 'Chest · Triceps · Front Delts',
      desc: 'Lie on a flat bench with a dumbbell in each hand at chest level. Press both weights up until arms are fully extended, then lower with control.',
      tip: 'Lower the dumbbells until your elbows are just below bench level — this full range is where most chest growth happens.',
    },
    {
      name: 'Dumbbell Chest Fly',
      tags: ['Chest'],
      volume: '3 sets × 12 reps',
      muscles: 'Chest · Front Delts',
      desc: 'Lie on a flat bench with dumbbells above your chest, palms facing each other. Lower both arms out wide in an arc, then bring them back together above your chest.',
      tip: 'Keep a soft bend in your elbows throughout — think "hugging a barrel." Never fully lock the elbows.',
    },
    {
      name: 'Decline Push-up',
      tags: ['Chest', 'Triceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Upper Chest · Shoulders · Triceps',
      desc: 'Place your feet elevated on a bench or chair and perform a push-up from that angled position. The elevation shifts more work onto the upper chest.',
      tip: 'The higher your feet, the more upper chest emphasis. Start with a low elevation and build up gradually.',
    },
    {
      name: 'Cable Crossover',
      tags: ['Chest'],
      volume: '3 sets × 12 reps',
      muscles: 'Chest · Front Delts',
      desc: 'Set cables or resistance bands at shoulder height. Step forward and press both handles together in front of your chest in a wide hugging arc, squeezing hard at the finish.',
      tip: 'Control the return — fighting the cables on the way back is half the work. Focus on the squeeze, not the weight.',
    },
    {
      name: 'Dumbbell Pullover',
      tags: ['Chest', 'Back'],
      volume: '3 sets × 12 reps',
      muscles: 'Chest · Lats · Triceps',
      desc: 'Lie perpendicular on a bench with only your upper back supported. Hold one dumbbell with both hands above your chest, then lower it back over your head in a wide arc.',
      tip: 'Keep a slight bend in your elbows and brace your core. Stop when you feel a deep stretch in your chest and lats.',
    },
    // ── Back ───────────────────────────────
    {
      name: 'Lat Pulldown',
      tags: ['Back', 'Biceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Lats · Biceps · Rear Delts',
      desc: 'Grip the bar slightly wider than shoulder-width. Pull it to your upper chest, squeezing your shoulder blades together.',
      tip: 'Lead with your elbows, not your hands. Lean back slightly and hold the squeeze.',
    },
    {
      name: 'Dumbbell Row',
      tags: ['Back', 'Biceps'],
      volume: '3 sets × 10 reps each side',
      muscles: 'Upper Back · Biceps',
      desc: 'Place one hand on a bench for support. Row the dumbbell to your hip, keeping your elbow close to your body.',
      tip: 'Think about driving your elbow toward your back pocket — this activates the lats properly.',
    },
    {
      name: 'Superman Hold',
      tags: ['Back', 'Legs'],
      volume: '3 sets × 10 reps (3 sec hold)',
      muscles: 'Lower Back · Glutes · Rear Delts',
      desc: 'Lie face down. Simultaneously lift your arms, chest, and legs off the floor. Hold for 3 seconds, then lower.',
      tip: 'Look at the floor, not forward — this keeps your neck in a neutral position and protects your spine.',
    },
    {
      name: 'Face Pull',
      tags: ['Shoulders', 'Back'],
      volume: '3 sets × 15 reps',
      muscles: 'Rear Delts · Rotator Cuff · Upper Back',
      desc: 'Using a cable or resistance band at face height, pull toward your forehead with elbows flared high and wide.',
      tip: 'One of the best exercises for shoulder health and posture. Do these often — they\'re almost impossible to overtrain.',
    },
    {
      name: 'Pull-up',
      tags: ['Back', 'Biceps'],
      volume: '3 sets × max reps',
      muscles: 'Lats · Biceps · Core',
      desc: 'Hang from a pull-up bar with palms facing away, hands slightly wider than shoulder-width. Pull your chest to the bar, then lower fully.',
      tip: 'Can\'t do a full rep yet? Use a resistance band for assistance, or practice negatives — jump to the top and lower yourself slowly.',
    },
    {
      name: 'Seated Cable Row',
      tags: ['Back', 'Biceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Mid Back · Biceps · Lats',
      desc: 'Sit at a cable row machine with feet braced. Pull the handle to your lower chest, squeezing your shoulder blades together at the peak.',
      tip: 'Sit tall — don\'t round forward on the return. Control the weight back to a full arm extension each rep.',
    },
    {
      name: 'Chest-Supported Row',
      tags: ['Back'],
      volume: '3 sets × 12 reps',
      muscles: 'Mid Back · Rear Delts · Biceps',
      desc: 'Lie chest-down on an incline bench. Hold dumbbells beneath you and row both up toward your hips, squeezing your shoulder blades at the top.',
      tip: 'The bench supports your torso so your lower back stays out of it — great for isolating your back without fatigue.',
    },
    {
      name: 'Barbell Row',
      tags: ['Back', 'Biceps'],
      volume: '3 sets × 8 reps',
      muscles: 'Upper Back · Lats · Biceps',
      desc: 'Hinge at the hips until your torso is near parallel to the floor. Pull a barbell to your lower chest, driving your elbows back and squeezing your lats at the top.',
      tip: 'Keep your lower back flat and core braced the entire set. If your back rounds when you add weight, drop the load.',
    },
    {
      name: 'Reverse Fly',
      tags: ['Back', 'Shoulders'],
      volume: '3 sets × 15 reps',
      muscles: 'Rear Delts · Upper Back · Traps',
      desc: 'Hinge forward at the hips with a flat back. Hold light dumbbells and raise both arms out to the sides until level with your shoulders, then lower.',
      tip: 'Go very light — rear delts are a small muscle in a mechanically weak position. Pinch your shoulder blades together at the top.',
    },
    // ── Shoulders ──────────────────────────
    {
      name: 'Dumbbell Shoulder Press',
      tags: ['Shoulders', 'Triceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Shoulders · Triceps',
      desc: 'Hold dumbbells at shoulder height. Press overhead until arms are fully extended, then lower with control.',
      tip: 'Avoid shrugging your shoulders. Start light — strict form beats heavy weight here.',
    },
    {
      name: 'Arnold Press',
      tags: ['Shoulders', 'Triceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Shoulders · Triceps · Upper Chest',
      desc: 'Hold dumbbells at chin height, palms facing you. As you press up, rotate your palms outward so they face forward at the top.',
      tip: 'The rotation hits all three heads of the deltoid. Go lighter than a standard press — the rotation adds real difficulty.',
    },
    {
      name: 'Dumbbell Lateral Raise',
      tags: ['Shoulders'],
      volume: '3 sets × 12 reps',
      muscles: 'Side Delts · Traps',
      desc: 'Hold dumbbells at your sides. Raise both arms out to shoulder height with a slight bend in the elbow, then lower with control.',
      tip: 'Go lighter than you think. Lead with your pinky side and stop at shoulder height — no higher.',
    },
    {
      name: 'Front Raise',
      tags: ['Shoulders'],
      volume: '3 sets × 12 reps',
      muscles: 'Front Delts · Upper Chest',
      desc: 'Hold dumbbells in front of your thighs, palms facing down. Raise both arms straight forward to shoulder height, then lower with control.',
      tip: 'Don\'t swing — if you have to cheat, go lighter. Keep your core braced and avoid leaning back.',
    },
    {
      name: 'Upright Row',
      tags: ['Shoulders', 'Back'],
      volume: '3 sets × 12 reps',
      muscles: 'Traps · Side Delts · Biceps',
      desc: 'Hold dumbbells or a barbell in front of your thighs. Pull the weight straight up to chin height, leading with your elbows flaring wide.',
      tip: 'Stop when your elbows reach shoulder height — going higher compresses the shoulder joint. Keep the weight close to your body.',
    },
    {
      name: 'Pike Push-up',
      tags: ['Shoulders', 'Triceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Shoulders · Triceps · Upper Chest',
      desc: 'Start in a downward dog position with hips high. Bend your elbows to lower your head toward the floor between your hands, then press back up.',
      tip: 'The steeper the angle, the more shoulder-focused the movement. A great overhead press builder with zero equipment.',
    },
    {
      name: 'Rear Delt Fly',
      tags: ['Shoulders', 'Back'],
      volume: '3 sets × 15 reps',
      muscles: 'Rear Delts · Upper Back',
      desc: 'Sit at the end of a bench and lean forward with your chest over your thighs. Hold dumbbells and raise them out to the sides with a slight elbow bend.',
      tip: 'One of the most neglected muscle groups. Training rear delts regularly fixes rounded posture and prevents shoulder injuries.',
    },
    {
      name: 'Band Pull-Apart',
      tags: ['Shoulders', 'Back'],
      volume: '3 sets × 15 reps',
      muscles: 'Rear Delts · Traps · Rotator Cuff',
      desc: 'Hold a resistance band in front of you at shoulder height, hands shoulder-width apart. Pull the band apart by moving your hands out to the sides until it touches your chest.',
      tip: 'Keep your arms straight and shoulder blades retracted. An underrated exercise for shoulder health — almost impossible to overtrain.',
    },
    // ── Biceps ─────────────────────────────
    {
      name: 'Dumbbell Bicep Curl',
      tags: ['Biceps'],
      volume: '3 sets × 12 reps',
      muscles: 'Biceps · Forearms',
      desc: 'Stand with dumbbells at your sides, palms facing forward. Curl both weights to shoulder height, then lower slowly.',
      tip: 'Keep your elbows pinned to your sides and avoid swinging. The lowering phase builds just as much muscle.',
    },
    {
      name: 'Hammer Curl',
      tags: ['Biceps'],
      volume: '3 sets × 12 reps',
      muscles: 'Biceps · Brachialis · Forearms',
      desc: 'Hold dumbbells with a neutral grip (palms facing each other). Curl both weights simultaneously, keeping wrists straight.',
      tip: 'Hammer curls build the brachialis — the muscle under the bicep that makes your arms look thicker from the front.',
    },
    {
      name: 'Concentration Curl',
      tags: ['Biceps'],
      volume: '3 sets × 12 reps each arm',
      muscles: 'Biceps Peak',
      desc: 'Sit on a bench with your legs spread. Rest your elbow against your inner thigh and curl a dumbbell up toward your shoulder, fully isolating the bicep.',
      tip: 'No swinging, no momentum — this is a pure isolation exercise. The slowest, most controlled curl wins.',
    },
    {
      name: 'Incline Dumbbell Curl',
      tags: ['Biceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Biceps · Long Head',
      desc: 'Sit on an incline bench (45–60°) with dumbbells hanging at your sides, arms fully extended. Curl both weights up without letting your elbows drift forward.',
      tip: 'The incline stretches the long head of the bicep at the start — this builds the peak and produces a deep pump.',
    },
    {
      name: 'Cable Curl',
      tags: ['Biceps'],
      volume: '3 sets × 12 reps',
      muscles: 'Biceps · Forearms',
      desc: 'Stand at a low cable pulley with a straight bar attachment. Curl the bar up to shoulder height with elbows fixed at your sides, then lower with control.',
      tip: 'Cables keep constant tension on the bicep throughout the full rep — unlike dumbbells, which get easier at the top.',
    },
    {
      name: 'Zottman Curl',
      tags: ['Biceps'],
      volume: '3 sets × 10 reps',
      muscles: 'Biceps · Brachialis · Forearms',
      desc: 'Curl dumbbells up with palms facing up. At the top, rotate your wrists so palms face down, then lower slowly in that reverse-grip position.',
      tip: 'The reverse-grip lowering phase hammers your brachialis and forearms simultaneously — two muscle groups, one exercise.',
    },
    {
      name: 'Chin-up',
      tags: ['Biceps', 'Back'],
      volume: '3 sets × max reps',
      muscles: 'Biceps · Lats · Core',
      desc: 'Hang from a bar with palms facing you, hands shoulder-width apart. Pull your chin above the bar, then lower fully with control.',
      tip: 'The supinated grip puts your biceps in their strongest position — chin-ups are often easier than pull-ups for beginners.',
    },
    // ── Abs ────────────────────────────────
    {
      name: 'Plank',
      tags: ['Abs'],
      volume: '3 sets × 20–30 sec',
      muscles: 'Core · Shoulders · Glutes',
      desc: 'Hold a forearm plank with a straight line from head to heels. Breathe steadily and resist any sagging.',
      tip: 'Squeeze your glutes and brace your core as if bracing for impact. Quality over duration.',
    },
    {
      name: 'Crunch',
      tags: ['Abs'],
      volume: '3 sets × 20 reps',
      muscles: 'Upper Abs',
      desc: 'Lie on your back with knees bent and hands lightly behind your head. Curl your upper back off the floor by contracting your abs, then lower with control.',
      tip: 'Don\'t pull on your neck — keep your elbows wide and let your abs do the lifting. Short, focused contractions beat big wild swings.',
    },
    {
      name: 'Leg Raise',
      tags: ['Abs'],
      volume: '3 sets × 15 reps',
      muscles: 'Lower Abs · Hip Flexors',
      desc: 'Lie flat on your back with legs straight. Raise both legs to 90 degrees, then lower slowly without letting your lower back peel off the floor.',
      tip: 'Place your hands under your glutes for support. Lower only as far as you can while keeping your lower back pressed flat.',
    },
    {
      name: 'Russian Twist',
      tags: ['Abs'],
      volume: '3 sets × 20 reps (10 each side)',
      muscles: 'Obliques · Core',
      desc: 'Sit with knees bent and feet slightly raised. Hold your hands together or grip a weight and rotate your torso side to side with control.',
      tip: 'The rotation should come from your torso, not your arms. Keep your chest tall and don\'t let your spine collapse.',
    },
    {
      name: 'Dead Bug',
      tags: ['Abs'],
      volume: '3 sets × 10 reps each side',
      muscles: 'Deep Core · Abs · Lower Back',
      desc: 'Lie on your back, arms pointing up and knees at 90° above your hips. Slowly extend your right arm overhead and left leg out simultaneously, then return and alternate.',
      tip: 'Press your lower back into the floor throughout. Move slowly — if your back lifts off the mat, you\'ve gone too far.',
    },
    {
      name: 'Mountain Climber',
      tags: ['Abs', 'Legs'],
      volume: '3 sets × 30 sec',
      muscles: 'Core · Shoulders · Hip Flexors',
      desc: 'Start in a high plank. Drive one knee toward your chest, then quickly alternate legs in a running motion while keeping your hips level.',
      tip: 'Don\'t let your hips rise or your lower back sag. Brace your core hard and move as fast as your form allows.',
    },
    // ── Legs ───────────────────────────────
    {
      name: 'Bodyweight Squat',
      tags: ['Legs'],
      volume: '3 sets × 12 reps',
      muscles: 'Quads · Glutes · Hamstrings',
      desc: 'Stand with feet shoulder-width apart. Lower until thighs are parallel to the floor, then drive back up through your heels.',
      tip: 'Keep your chest up and knees tracking over your toes. Hold a doorframe if balance is tricky.',
    },
    {
      name: 'Goblet Squat',
      tags: ['Legs', 'Abs'],
      volume: '3 sets × 12 reps',
      muscles: 'Quads · Glutes · Core',
      desc: 'Hold a dumbbell or kettlebell at chest height with both hands. Squat deep, keeping elbows inside your knees at the bottom.',
      tip: 'The weight in front acts as a counterbalance — use it to sit deeper than you normally would.',
    },
    {
      name: 'Reverse Lunge',
      tags: ['Legs'],
      volume: '3 sets × 10 reps each leg',
      muscles: 'Quads · Glutes · Hamstrings',
      desc: 'Step one foot backward and lower your back knee toward the floor. Drive through your front heel to return to standing.',
      tip: 'Reverse lunges are easier on the knees than forward lunges — a great starting point before progressing.',
    },
    {
      name: 'Glute Bridge',
      tags: ['Legs'],
      volume: '3 sets × 15 reps',
      muscles: 'Glutes · Hamstrings · Lower Back',
      desc: 'Lie on your back with knees bent and feet flat. Drive your hips up until your body forms a straight line from knees to shoulders.',
      tip: 'Squeeze your glutes hard at the top and hold for a second. Don\'t let your lower back do the work.',
    },
    {
      name: 'Wall Sit',
      tags: ['Legs'],
      volume: '3 sets × 30–45 sec',
      muscles: 'Quads · Glutes · Calves',
      desc: 'Slide your back down a wall until your thighs are parallel to the floor. Hold the position with your knees at 90 degrees.',
      tip: 'Keep your back flat against the wall and don\'t let your knees cave inward. Breathe steadily throughout.',
    },
    {
      name: 'Calf Raise',
      tags: ['Legs'],
      volume: '3 sets × 15–20 reps',
      muscles: 'Gastrocnemius · Soleus',
      desc: 'Stand on the edge of a step or flat floor. Rise onto your toes as high as possible, hold briefly, then lower fully.',
      tip: 'Go slow on the way down — a full stretch at the bottom is where most of the growth happens.',
    },
    {
      name: 'Dumbbell Romanian Deadlift',
      tags: ['Legs', 'Back'],
      volume: '3 sets × 10 reps',
      muscles: 'Hamstrings · Glutes · Lower Back',
      desc: 'Hold dumbbells in front of your thighs. Hinge at the hips, sending them back while lowering the weights along your legs.',
      tip: 'Keep a slight bend in the knees and maintain a neutral spine — no rounding.',
    },
    {
      name: 'Step-up',
      tags: ['Legs'],
      volume: '3 sets × 10 reps each leg',
      muscles: 'Quads · Glutes · Hamstrings',
      desc: 'Stand in front of a bench or box. Step one foot up, drive through that heel to stand fully on top, then step down and alternate legs.',
      tip: 'Don\'t push off your back foot — make the working leg do all the lifting. Add dumbbells once bodyweight feels easy.',
    },
    {
      name: 'Sumo Squat',
      tags: ['Legs'],
      volume: '3 sets × 12 reps',
      muscles: 'Inner Thighs · Glutes · Quads',
      desc: 'Stand with feet wider than shoulder-width and toes turned out. Hold a dumbbell between your legs and squat down, keeping your chest tall and knees tracking over toes.',
      tip: 'Push your knees outward in line with your toes. The wider stance hits your inner thighs and glutes harder than a standard squat.',
    },
    {
      name: 'Bulgarian Split Squat',
      tags: ['Legs'],
      volume: '3 sets × 8 reps each leg',
      muscles: 'Quads · Glutes · Balance',
      desc: 'Place one foot behind you elevated on a bench. Hold dumbbells and lower your back knee toward the floor, then drive back up through your front heel.',
      tip: 'One of the hardest single-leg exercises there is. Start with bodyweight only — nail your balance and depth before adding load.',
    },
    {
      name: 'Nordic Hamstring Curl',
      tags: ['Legs'],
      volume: '3 sets × 6–8 reps',
      muscles: 'Hamstrings · Glutes',
      desc: 'Kneel on a mat with feet anchored under something sturdy. Slowly lower your torso toward the floor using your hamstrings, then push back up.',
      tip: 'Extremely difficult — most people need to push off the floor to return. That\'s fine. The slow lowering phase is where all the work happens.',
    },
    {
      name: 'Box Jump',
      tags: ['Legs'],
      volume: '3 sets × 8 reps',
      muscles: 'Quads · Glutes · Calves · Power',
      desc: 'Stand in front of a box. Bend your knees, swing your arms, and explosively jump up, landing softly with both feet on the surface. Step down and reset.',
      tip: 'Land with soft, bent knees — never land stiff. Start with a low box (12–18 inches) and prioritize soft landings over height.',
    },
    // ── Full Body ──────────────────────────
    {
      name: 'Farmer\'s Carry',
      tags: ['Shoulders', 'Abs', 'Legs'],
      volume: '3 sets × 30 meters',
      muscles: 'Forearms · Traps · Core · Legs',
      desc: 'Hold a heavy dumbbell in each hand and walk a set distance with an upright posture and controlled steps.',
      tip: 'Keep your shoulders packed down and back — don\'t let them creep up toward your ears as you fatigue.',
    },
  ],
  Cardio: [
    {
      name: 'Brisk Walk',
      volume: '20–30 min',
      muscles: 'Full body · Low impact',
      desc: 'Walk at a pace where you can hold a conversation but feel slightly breathless. Great foundation for all fitness levels.',
      tip: 'Swing your arms naturally and keep your posture tall. Aim for 7,000+ steps total per day.',
    },
    {
      name: 'Run-Walk Intervals',
      volume: '20 min total',
      muscles: 'Legs · Cardiovascular System',
      desc: 'Alternate 1 minute jogging with 2 minutes walking. Gradually extend the jog intervals week by week.',
      tip: 'If you can\'t speak in short sentences, slow down. Pace is secondary to consistency.',
    },
    {
      name: 'Stationary Bike',
      volume: '20 min at low resistance',
      muscles: 'Quads · Hamstrings · Calves',
      desc: 'Pedal at a comfortable cadence with low resistance. Focus on building aerobic endurance, not burning out.',
      tip: 'Adjust seat height so your leg has a slight bend at the bottom of each pedal stroke.',
    },
    {
      name: 'Jump Rope',
      volume: '3 rounds × 3 min',
      muscles: 'Calves · Shoulders · Coordination',
      desc: 'Basic two-foot jumps at a comfortable pace. Rest 1 min between rounds and focus on rhythm.',
      tip: 'Jump just high enough to clear the rope. Small, quick hops are far more efficient than big ones.',
    },
    {
      name: 'Elliptical Machine',
      volume: '20–25 min',
      muscles: 'Full body · Low impact',
      desc: 'Great low-impact cardio that protects your joints. Use the handles to engage your arms and maintain moderate resistance.',
      tip: 'Push through your heels and keep an upright posture. Don\'t lean on the handles.',
    },
    {
      name: 'Beginner HIIT',
      volume: '20 min (30 sec on / 30 sec off)',
      muscles: 'Full Body',
      desc: 'Alternate high-intensity efforts — jumping jacks, high knees, mountain climbers — with equal rest periods.',
      tip: 'Choose exercises you can do with good form at speed. Quality reps only — no sloppy movement.',
    },
    {
      name: 'Row Machine',
      volume: '3 × 5 min with 2 min rest',
      muscles: 'Back · Legs · Core · Arms',
      desc: 'Sit with feet strapped in and grip the handle. Drive through your legs first, then lean back slightly and pull the handle to your lower chest. Return by extending your arms, hinging forward, then bending your knees.',
      tip: 'The power order is legs → core → arms. Most beginners use too much arm — 60% of the work should come from your legs. Keep your back tall throughout.',
    },
    {
      name: 'Bodyweight HIIT Blast',
      volume: '4 rounds · 30 sec on / 15 sec rest per exercise',
      muscles: 'Full Body',
      desc: '5 exercises back to back: Jumping Jacks (jump feet wide while raising arms overhead, then return); High Knees (run in place, driving knees up to hip height); Push-up (lower chest to floor and press back up); Mountain Climber (from plank, alternate driving knees to chest rapidly); Squat Jump (drop into a squat, then explode upward and land softly with bent knees). Rest 60 sec between rounds.',
      tip: 'Modify any exercise if needed — step instead of jump, knees-down push-up, etc. The goal is staying moving the full 30 seconds with good form.',
    },
    {
      name: 'Lower Body HIIT Burner',
      volume: '3 rounds · 40 sec on / 20 sec rest per exercise',
      muscles: 'Quads · Glutes · Hamstrings · Calves',
      desc: '5 exercises in sequence: Jump Squat (squat down then explode upward, landing with soft bent knees); Reverse Lunge (step back, drop rear knee toward the floor, drive forward through front heel); Lateral Shuffle (stay low and step side to side quickly, 3 steps each direction); Glute Bridge Pulse (in bridge position, pulse hips upward rapidly in short bursts); Broad Jump (jump forward as far as possible, walk back, reset). Rest 90 sec between rounds.',
      tip: 'Land every jump with soft, bent knees — never stiff legs. If impact is an issue, swap jumps for their non-jumping versions and slow down.',
    },
    {
      name: 'Core & Cardio HIIT Circuit',
      volume: '4 rounds · 30 sec on / 15 sec rest per exercise',
      muscles: 'Core · Full Body',
      desc: '5 exercises in sequence: Burpee (squat and place hands on floor, jump feet back to a plank, do a push-up, jump feet back in, then leap upward); Bicycle Crunch (lying down, alternate bringing each elbow toward the opposite knee while cycling your legs); Plank to Push-up (from forearm plank, press up to hands one arm at a time, then back down); Russian Twist (seated with feet raised, rotate torso side to side holding hands together); Sprint in Place (max-speed high knees for the full 30 seconds). Rest 60 sec between rounds.',
      tip: 'The burpee is the hardest exercise here — scale it by removing the jump or the push-up if needed. Keep moving even if you have to slow down.',
    },
    {
      name: 'Easy Recovery Run',
      volume: '20–30 min',
      muscles: 'Legs · Cardiovascular System',
      desc: 'Run at a fully conversational pace — you should be able to speak in complete sentences without effort. The goal is building aerobic base, not performance.',
      tip: 'Most runners run easy days too hard. Slow down more than feels right. These runs build the aerobic engine that makes everything else faster.',
    },
    {
      name: 'Tempo Run',
      volume: '20–30 min sustained',
      muscles: 'Legs · Cardiovascular System',
      desc: 'Run at a comfortably hard pace — you can push out a few words but not full sentences. Aim for roughly 85% effort, held consistently for the full duration.',
      tip: 'Tempo runs train your lactate threshold — the point where your body tips from aerobic to anaerobic. This is where real speed gains come from.',
    },
    {
      name: '400m Repeats',
      volume: '6–8 × 400m with 90 sec rest',
      muscles: 'Legs · Speed · Cardiovascular System',
      desc: 'Run 400 meters (one track lap) at a hard effort — roughly your 5K race pace. Rest 90 seconds between each, then go again.',
      tip: 'The first two reps always feel easy. Save something for the last two. Consistent splits across all reps is the real goal.',
    },
    {
      name: 'Hill Sprints',
      volume: '8–10 × 15 sec uphill, walk down',
      muscles: 'Quads · Glutes · Calves · Power',
      desc: 'Find a moderate hill. Sprint hard uphill for 15 seconds, walk back down as your rest. Focus on driving your knees high and pumping your arms.',
      tip: 'Hill sprints build explosive power with less injury risk than flat sprints. The incline limits top speed and naturally cushions each landing.',
    },
    {
      name: 'Fartlek Run',
      volume: '25–35 min',
      muscles: 'Legs · Cardiovascular System',
      desc: 'Run easy and randomly surge for 30–60 seconds — to the next lamppost, up a hill, or whenever the mood strikes. Then settle back to easy pace and repeat.',
      tip: 'Fartlek means "speed play" in Swedish. No structure, no watch — just feel. A perfect introduction to speed work without the pressure of timed intervals.',
    },
    {
      name: 'Long Run',
      volume: '40–60 min at easy pace',
      muscles: 'Legs · Cardiovascular System · Mental Endurance',
      desc: 'Run at a comfortable, fully conversational pace for an extended time. The goal isn\'t speed — it\'s time on feet and building your aerobic ceiling.',
      tip: 'Go slower than feels necessary and you\'ll finish feeling better than you started. The long run is the backbone of any distance runner\'s week.',
    },
    {
      name: 'Sprint Intervals',
      volume: '8 × 30 sec sprint / 90 sec walk',
      muscles: 'Full Body · Speed · Power',
      desc: 'Sprint at 90–95% of your maximum speed for 30 seconds, then walk for 90 seconds to recover. Repeat for 8 rounds.',
      tip: 'True sprinting means leaning forward, driving your knees, and pumping your arms hard. You should be breathing very hard at the end of each rep.',
    },
    {
      name: 'Strides',
      volume: '4–6 × 20 sec accelerations',
      muscles: 'Legs · Speed · Neuromuscular',
      desc: 'At the end of an easy run, gradually accelerate over 20 seconds to roughly 90% of your top speed, hold briefly, then decelerate smoothly. Walk back and repeat.',
      tip: 'Strides improve running economy and leg turnover without adding meaningful fatigue. Add them to two easy runs per week for quick speed gains.',
    },
    {
      name: '5K Time Trial',
      volume: '5K at race effort',
      muscles: 'Legs · Cardiovascular System · Mental Toughness',
      desc: 'Run 5 kilometers as fast as you can sustainably maintain. Start controlled — going out too fast is the most common mistake. Aim for a negative split (second half faster).',
      tip: 'The first kilometer should feel almost too easy. If you\'re suffering by kilometer two, you went out too hard. Track your time over weeks to measure real progress.',
    },
  ],
  Sports: [
    {
      name: 'Basketball: Shooting Drills',
      volume: '20–30 min',
      muscles: 'Legs · Shoulders · Coordination',
      desc: 'Practice stationary shots from close range before adding movement. Use the BEEF method: Balance, Eyes, Elbow, Follow-through.',
      tip: 'Start 3–5 feet from the basket. Master the mechanics before adding distance or defenders.',
    },
    {
      name: 'Tennis: Wall Rally',
      volume: '15–20 min',
      muscles: 'Forearms · Shoulders · Footwork',
      desc: 'Hit against a practice wall to build consistency. Let the ball bounce once and return it to the same spot.',
      tip: 'Watch the ball all the way to your racket. Good footwork beats a strong swing every time.',
    },
    {
      name: 'Soccer: Passing & Ball Control',
      volume: '20 min',
      muscles: 'Legs · Core · Coordination',
      desc: 'Practice passing against a wall or with a partner. Focus on receiving and controlling the ball cleanly before your next touch.',
      tip: 'Use the inside of your foot for accuracy. Keep your eyes up — not glued to the ball.',
    },
    {
      name: 'Swimming: Freestyle Basics',
      volume: '20–30 min (rest as needed)',
      muscles: 'Full Body',
      desc: 'Swim at a slow, comfortable pace. Focus on breathing rhythm: exhale underwater, inhale to the side.',
      tip: 'Rotate your body slightly with each stroke — this reduces drag and generates power from your core.',
    },
    {
      name: 'Shadow Boxing',
      volume: '3 rounds × 3 min',
      muscles: 'Shoulders · Core · Legs',
      desc: 'Practice basic punches (jab, cross, hook) while moving your feet and maintaining your guard position.',
      tip: 'Keep your chin down and hands up. Snap punches back to guard — don\'t leave them hanging out.',
    },
    {
      name: 'Volleyball: Serve & Bump',
      volume: '20 min',
      muscles: 'Shoulders · Forearms · Legs',
      desc: 'Practice underhand serves and forearm passes (bumps). Focus on clean contact and directing the ball where you want.',
      tip: 'For bumping, keep your arms flat and angled toward your target. Meet the ball — don\'t swing at it.',
    },
  ],
  Activities: [
    {
      name: 'Flat Trail Hike',
      volume: '30–60 min',
      muscles: 'Legs · Cardiovascular System',
      desc: 'Choose a well-marked, flat trail and set a comfortable pace. Hiking is low-intensity but builds real endurance over distance.',
      tip: 'Wear supportive footwear and bring water. Start short and add distance as your legs adapt.',
    },
    {
      name: 'Beginner Yoga (Hatha)',
      volume: '30 min session',
      muscles: 'Full Body · Flexibility · Balance',
      desc: 'Follow a beginner Hatha class covering foundational poses: Downward Dog, Warrior I, Child\'s Pose, and Cat-Cow.',
      tip: 'Never force a stretch. Breathe deeply into each pose and focus on alignment over depth.',
    },
    {
      name: 'Bouldering (V0–V1)',
      volume: '1 hour session',
      muscles: 'Forearms · Back · Core',
      desc: 'Start on V0 and V1 rated problems at a climbing gym. The puzzle-solving aspect makes it addictive fast.',
      tip: 'Trust your feet — look where you place them. Beginners overuse their arms; your legs should do the work.',
    },
    {
      name: 'Beginner Dance Class',
      volume: '45–60 min class',
      muscles: 'Full Body · Coordination · Rhythm',
      desc: 'Try a beginner salsa, hip-hop, or contemporary class. Focus on having fun and following the beat rather than perfecting moves.',
      tip: 'Relax and commit to the movement. Everyone looks awkward at first — that\'s the deal.',
    },
    {
      name: 'Leisure Cycling',
      volume: '20–30 min',
      muscles: 'Quads · Glutes · Calves',
      desc: 'Ride at a comfortable pace on flat terrain. Great for joint-friendly cardio and covers far more ground than walking.',
      tip: 'Adjust your saddle so your knee has a slight bend at the bottom of each pedal stroke — this prevents knee pain.',
    },
    {
      name: 'Kayaking / Paddleboarding',
      volume: '45–60 min',
      muscles: 'Core · Shoulders · Back',
      desc: 'Paddle at an easy pace on calm water. Focus on rotating your torso with each stroke rather than pulling with your arms alone.',
      tip: 'Keep your grip relaxed — a tight grip leads to forearm fatigue within minutes.',
    },
  ],
}

const RANK_TITLES = [
  'Rookie', 'Trainee', 'Contender', 'Competitor', 'Athlete',
  'Challenger', 'Warrior', 'Champion', 'Elite', 'Legend',
]
function getRank(level) {
  return RANK_TITLES[Math.min(level - 1, RANK_TITLES.length - 1)]
}

// ── Class System ──────────────────────────────────────────────
const CLASSES = {
  Strength:   ['Brawler',  'Berserker',  'Titan'],
  Cardio:     ['Sprinter', 'Windrunner', 'Ghost'],
  Sports:     ['Rookie',   'Contender',  'Champion'],
  Activities: ['Wanderer', 'Ranger',     'Apex'],
}
const CLASS_THRESHOLDS = [2000, 10000, 25000]

function getClass(categoryXP) {
  const [cat, xp] = Object.entries(categoryXP).sort((a, b) => b[1] - a[1])[0]
  if (xp >= CLASS_THRESHOLDS[2]) return { title: CLASSES[cat][2], category: cat, tier: 3 }
  if (xp >= CLASS_THRESHOLDS[1]) return { title: CLASSES[cat][1], category: cat, tier: 2 }
  if (xp >= CLASS_THRESHOLDS[0]) return { title: CLASSES[cat][0], category: cat, tier: 1 }
  return null
}

// ── localStorage ──────────────────────────────────────────────
function todayKey() { return new Date().toISOString().slice(0, 10) }

// ── Strength Day Splits ────────────────────────────────────────
const STRENGTH_DAYS = [
  {
    label: 'Chest / Tri',
    workouts: [
      { id: 'ct1', name: 'Bench Press',      desc: '4 sets × 8 reps' },
      { id: 'ct2', name: 'Incline Press',    desc: '3 sets × 10 reps' },
      { id: 'ct3', name: 'Chest Fly',        desc: '3 sets × 12 reps' },
      { id: 'ct4', name: 'Tricep Dips',      desc: '3 sets to failure' },
      { id: 'ct5', name: 'Tricep Pushdown',  desc: '3 sets × 12 reps' },
    ],
  },
  {
    label: 'Back / Bi',
    workouts: [
      { id: 'bb1', name: 'Pull-ups',         desc: '3 sets to failure' },
      { id: 'bb2', name: 'Barbell Row',      desc: '4 sets × 8 reps' },
      { id: 'bb3', name: 'Lat Pulldown',     desc: '3 sets × 10 reps' },
      { id: 'bb4', name: 'Bicep Curl',       desc: '3 sets × 12 reps' },
      { id: 'bb5', name: 'Hammer Curl',      desc: '3 sets × 12 reps' },
    ],
  },
  {
    label: 'Legs / Shoulders',
    workouts: [
      { id: 'ls1', name: 'Squat',            desc: '4 sets × 6 reps' },
      { id: 'ls2', name: 'Deadlift',         desc: '3 sets × 5 reps' },
      { id: 'ls3', name: 'Leg Press',        desc: '3 sets × 12 reps' },
      { id: 'ls4', name: 'Shoulder Press',   desc: '3 sets × 10 reps' },
      { id: 'ls5', name: 'Lateral Raise',    desc: '3 sets × 15 reps' },
    ],
  },
]

// ── Default workouts ──────────────────────────────────────────
const DEFAULT_WORKOUTS = {
  Strength: [],
  Cardio: [
    { id: 'c1', name: '5K Run',         desc: 'Outdoors or treadmill' },
    { id: 'c2', name: 'Jump Rope',      desc: '3 rounds × 5 min' },
    { id: 'c3', name: 'Cycling',        desc: '20 min steady state' },
    { id: 'c4', name: 'HIIT',           desc: '20 min intervals' },
    { id: 'c5', name: 'Row Machine',    desc: '2000m for time' },
  ],
  Sports: [
    { id: 'sp1', name: 'Basketball',    desc: 'Practice or pickup game' },
    { id: 'sp2', name: 'Tennis',        desc: '1 hour session' },
    { id: 'sp3', name: 'Soccer',        desc: 'Practice or match' },
    { id: 'sp4', name: 'Swimming',      desc: '30 min laps' },
    { id: 'sp5', name: 'Martial Arts',  desc: 'Class or sparring session' },
  ],
  Activities: [
    { id: 'a1', name: 'Hiking',         desc: 'Trail walk or hill climb' },
    { id: 'a2', name: 'Yoga',           desc: '30 min session' },
    { id: 'a3', name: 'Rock Climbing',  desc: 'Gym or outdoor' },
    { id: 'a4', name: 'Dancing',        desc: '45 min session' },
    { id: 'a5', name: 'Kayaking',       desc: '1 hour on water' },
  ],
}

const DEFAULT_CAT_XP = { Strength: 0, Cardio: 0, Sports: 0, Activities: 0 }

// ── XP Bar (master) ───────────────────────────────────────────
function XPBar({ totalXP }) {
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1
  const xpIn  = totalXP % XP_PER_LEVEL
  const pct   = Math.min((xpIn / XP_PER_LEVEL) * 100, 100)

  return (
    <div className="xp-section">
      <div className="xp-meta">
        <div className="level-badge">
          <span className="level-num">LVL {level}</span>
          <span className="level-rank">{getRank(level)}</span>
        </div>
        <div className="xp-numbers">
          <span className="xp-current">{xpIn.toLocaleString()}</span>
          <span className="xp-sep"> / {XP_PER_LEVEL.toLocaleString()} XP</span>
        </div>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="xp-hint">{(XP_PER_LEVEL - xpIn).toLocaleString()} XP to Level {level + 1}</div>
    </div>
  )
}

// ── Stat Board ────────────────────────────────────────────────
function StatBoard({ categoryXP, activeCategory, onSelect }) {
  const maxXP = Math.max(...Object.values(categoryXP), 1)

  return (
    <div className="stat-board">
      {CATEGORIES.map(cat => {
        const xp  = categoryXP[cat] || 0
        const pct = Math.min((xp / maxXP) * 100, 100)
        const col = CAT_COLORS[cat]
        const active = cat === activeCategory

        return (
          <button
            key={cat}
            className={`stat-card${active ? ' active' : ''}`}
            onClick={() => onSelect(cat)}
            style={active ? { borderColor: col.bar, background: col.soft } : {}}
          >
            <div className="stat-card-top">
              <span className="stat-icon">{CAT_ICONS[cat]}</span>
              <span className="stat-cat-name">{cat}</span>
              {active && <span className="stat-active-dot" style={{ background: col.bar }} />}
            </div>
            <div className="stat-xp">{xp.toLocaleString()} <span>XP</span></div>
            <div className="stat-mini-track">
              <div
                className="stat-mini-fill"
                style={{ width: `${pct}%`, background: col.bar, transition: 'width 0.5s ease' }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Category Dropdown ─────────────────────────────────────────
function CategoryDropdown({ active, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="cat-dropdown" ref={ref}>
      <button className="cat-dropdown-btn" onClick={() => setOpen(o => !o)}>
        <span>{CAT_ICONS[active]} {active}</span>
        <svg className={`dropdown-chevron${open ? ' open' : ''}`} viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M4 6l4 4 4-4" stroke="#4a5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="cat-dropdown-menu">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-dropdown-item${cat === active ? ' selected' : ''}`}
              onClick={() => { onChange(cat); setOpen(false) }}
            >
              <span className="item-icon">{CAT_ICONS[cat]}</span>
              <span className="item-name">{cat}</span>
              {cat === active && (
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" className="item-check">
                  <path d="M3 8l4 4 6-7" stroke="#89CFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Workout Card ─────────────────────────────────────────────
function RunningCard({ done, todayMiles, onRun, catColor }) {
  const [miles, setMiles] = useState('')
  const xpPreview = miles ? Math.round(parseFloat(miles) * 100) : null

  if (done) {
    return (
      <div className="workout-card done run-card" style={{ borderColor: catColor + '66' }}>
        <div className="workout-info">
          <span className="workout-name">🏃 Running</span>
          <span className="workout-desc">{todayMiles} miles logged today · +{Math.round(todayMiles * 100)} XP earned</span>
        </div>
        <div className="card-actions">
          <div className="complete-btn completed">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <circle cx="10" cy="10" r="9" fill={catColor} />
              <path d="M6 10.5l3 3 5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="workout-card run-card">
      <div className="workout-info">
        <span className="workout-name">🏃 Running</span>
        <span className="workout-desc">100 XP per mile</span>
      </div>
      <div className="run-input-row">
        <input
          type="number"
          min="0.1"
          step="0.1"
          placeholder="Miles"
          value={miles}
          onChange={e => setMiles(e.target.value)}
          className="miles-input"
        />
        <button
          className="complete-btn"
          style={{ background: catColor }}
          disabled={!miles || parseFloat(miles) <= 0}
          onClick={() => onRun(parseFloat(miles))}
        >
          {xpPreview ? `+${xpPreview} XP` : 'Log Run'}
        </button>
      </div>
    </div>
  )
}

function WorkoutCard({ workout, done, onComplete, onEdit, catColor }) {
  return (
    <div className={`workout-card${done ? ' done' : ''}`} style={done ? { borderColor: catColor + '66' } : {}}>
      <div className="workout-info">
        <span className="workout-name">{workout.name}</span>
        {workout.desc && <span className="workout-desc">{workout.desc}</span>}
      </div>
      <div className="card-actions">
        <button className="edit-btn" onClick={onEdit} title="Edit workout">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={`complete-btn${done ? ' completed' : ''}`}
          onClick={onComplete}
          disabled={done}
          style={!done ? { background: catColor } : {}}
        >
          {done ? (
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <circle cx="10" cy="10" r="9" fill={catColor} />
              <path d="M6 10.5l3 3 5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : `+${XP_PER_WORKOUT} XP`}
        </button>
      </div>
    </div>
  )
}

// ── Edit Workout Modal ────────────────────────────────────────
function EditWorkoutModal({ workout, catName, onSave, onClose }) {
  const [name, setName] = useState(workout.name)
  const [desc, setDesc] = useState(workout.desc)
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ ...workout, name: name.trim(), desc: desc.trim() })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{CAT_ICONS[catName]} Edit Workout</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <label className="field">
            <span>Workout name</span>
            <input ref={ref} value={name} onChange={e => setName(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span>Description <em>(optional)</em></span>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. 4 sets × 8 reps" maxLength={60} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add Workout Modal ─────────────────────────────────────────
function AddWorkoutModal({ catName, onAdd, onClose }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus() }, [])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ id: `w${Date.now()}`, name: name.trim(), desc: desc.trim() })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{CAT_ICONS[catName]} Add to {catName}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <label className="field">
            <span>Workout name</span>
            <input ref={ref} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Box Jumps" maxLength={40} />
          </label>
          <label className="field">
            <span>Description <em>(optional)</em></span>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. 3 sets × 10 reps" maxLength={60} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Workout Panel ─────────────────────────────────────────────
function WorkoutPanel({ category, workouts, completed, onComplete, onAddWorkout, onEditWorkout, onRun, todayRun, strengthDay, onCycleStrengthDay }) {
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const col        = CAT_COLORS[category]
  const dayWorkouts = category === 'Strength' ? STRENGTH_DAYS[strengthDay].workouts : []
  const customList  = workouts[category] || []
  const list        = category === 'Strength' ? [...dayWorkouts, ...customList] : customList
  const runDone     = category === 'Cardio' && completed.includes('cardio-run')
  const doneToday   = list.filter(w => completed.includes(String(w.id))).length + (runDone ? 1 : 0)
  const totalCount  = list.length + (category === 'Cardio' ? 1 : 0)

  return (
    <div className="workout-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="panel-icon">{CAT_ICONS[category]}</span>
          <h2 className="panel-title">{category}</h2>
        </div>
        {category === 'Strength' && (
          <div className="day-cycle">
            <button className="day-arrow" onClick={() => onCycleStrengthDay(-1)}>‹</button>
            <span className="day-label">{STRENGTH_DAYS[strengthDay].label}</span>
            <button className="day-arrow" onClick={() => onCycleStrengthDay(1)}>›</button>
          </div>
        )}
        <span className="panel-sub">{doneToday} of {totalCount} completed today</span>
      </div>

      <div className="workout-list">
        {category === 'Cardio' && (
          <RunningCard
            done={runDone}
            todayMiles={todayRun?.miles}
            onRun={onRun}
            catColor={col.bar}
          />
        )}
        {list.length === 0 && category !== 'Cardio' && (
          <div className="empty-state">No workouts yet — add one below.</div>
        )}
        {list.map(w => (
          <WorkoutCard
            key={w.id}
            workout={w}
            done={completed.includes(String(w.id))}
            onComplete={() => onComplete(w.id, category)}
            onEdit={() => setEditingWorkout(w)}
            catColor={col.bar}
          />
        ))}
      </div>

      <button className="add-workout-btn" onClick={() => setShowAddModal(true)}>
        + Add Workout
      </button>

      {showAddModal && (
        <AddWorkoutModal
          catName={category}
          onAdd={w => { onAddWorkout(category, w); setShowAddModal(false) }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout}
          catName={category}
          onSave={updated => onEditWorkout(category, updated)}
          onClose={() => setEditingWorkout(null)}
        />
      )}
    </div>
  )
}

// ── Guide Card ────────────────────────────────────────────────
function GuideCard({ entry, category, onAddToWorkouts, alreadyAdded }) {
  const col = CAT_COLORS[category]
  return (
    <div className="guide-card">
      <div className="guide-card-header">
        <h3 className="guide-name">{entry.name}</h3>
        <div className="guide-badges">
          {entry.tags ? (
            entry.tags.map(tag => (
              <span
                key={tag}
                className="guide-badge tag-badge"
                style={{ background: TAG_COLORS[tag].bg, color: TAG_COLORS[tag].text }}
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="guide-badge">Beginner</span>
          )}
        </div>
      </div>
      <div className="guide-volume" style={{ color: col.bar }}>{entry.volume}</div>
      <div className="guide-muscles">{entry.muscles}</div>
      <p className="guide-desc">{entry.desc}</p>
      <div className="guide-tip">
        <span className="tip-label">💡</span>
        <span>{entry.tip}</span>
      </div>
      <button
        className={`guide-add-btn${alreadyAdded ? ' added' : ''}`}
        onClick={() => onAddToWorkouts(category, { id: `g${Date.now()}`, name: entry.name, desc: entry.volume })}
        disabled={alreadyAdded}
        style={!alreadyAdded ? { borderColor: col.bar, color: col.bar } : {}}
      >
        {alreadyAdded ? '✓ Added to My Workouts' : '+ Add to My Workouts'}
      </button>
    </div>
  )
}

// ── Guidebook Page ─────────────────────────────────────────────
function GuidebookPage({ workouts, onAddToWorkouts }) {
  const [activeTab, setActiveTab] = useState('Strength')

  function isAdded(category, name) {
    return (workouts[category] || []).some(w => w.name === name)
  }

  return (
    <div className="guidebook-page">
      <div className="guidebook-hero">
        <div className="guidebook-hero-inner">
          <h1 className="guidebook-title">📖 Workout Guide Book</h1>
          <p className="guidebook-sub">Beginner-friendly workouts for every category. Add any to your dashboard with one click.</p>
        </div>
      </div>

      <div className="guide-tabs-wrap">
        <div className="guide-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`guide-tab${cat === activeTab ? ' active' : ''}`}
              onClick={() => setActiveTab(cat)}
              style={cat === activeTab ? { borderColor: CAT_COLORS[cat].bar, color: CAT_COLORS[cat].bar, background: CAT_COLORS[cat].soft } : {}}
            >
              {CAT_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="guide-grid-wrap">
        <div className="guide-grid">
          {BEGINNER_GUIDE[activeTab].map((entry, i) => (
            <GuideCard
              key={i}
              entry={entry}
              category={activeTab}
              onAddToWorkouts={onAddToWorkouts}
              alreadyAdded={isAdded(activeTab, entry.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Level-Up Toast ────────────────────────────────────────────
function LevelUpToast({ level, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="levelup-toast">
      <span className="levelup-icon">⚡</span>
      <div>
        <div className="levelup-title">Level Up!</div>
        <div className="levelup-sub">You reached <strong>Level {level}</strong> — {getRank(level)}</div>
      </div>
    </div>
  )
}

// ── Name Screen ───────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      onAuth(data)
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="name-screen">
      <div className="name-card">
        <div className="name-logo">⚡</div>
        <h1>FitQuest</h1>
        <p>{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</p>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={submit}>
          <input
            autoFocus
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            maxLength={24}
            className="name-input"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="name-input"
            style={{ marginTop: 8 }}
          />
          <button type="submit" className="btn-primary full" disabled={!username.trim() || !password || loading}>
            {loading ? '…' : mode === 'login' ? 'Log In →' : 'Register →'}
          </button>
        </form>
        <button className="auth-switch" onClick={switchMode}>
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}

// ── Journal Page ─────────────────────────────────────────────
function JournalPage({ onXPAwarded }) {
  const [entries,    setEntries]    = useState([])
  const [draft,      setDraft]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flash,      setFlash]      = useState(null) // 'earned' | 'saved'
  const today = todayKey()
  const todayEntry = entries.find(e => e.date === today)

  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setEntries(data)
        const existing = data.find(e => e.date === todayKey())
        if (existing) setDraft(existing.entry)
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setSubmitting(true)
    const res  = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry: draft.trim() }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) return
    if (data.xpAwarded > 0) {
      onXPAwarded(data.categoryXP)
      setFlash('earned')
    } else {
      setFlash('saved')
    }
    setTimeout(() => setFlash(null), 3000)
    // Refresh entries
    fetch('/api/journal').then(r => r.json()).then(setEntries)
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const pastEntries = entries.filter(e => e.date !== today)

  return (
    <div className="journal-page">
      <div className="journal-header">
        <h2>Journal</h2>
        <p>Write about your workout — earn {200} XP for your first entry each day.</p>
      </div>

      <div className="journal-today">
        <div className="journal-today-label">
          Today · {formatDate(today)}
          {todayEntry && <span className="journal-xp-badge">+{todayEntry.xp_awarded} XP earned</span>}
        </div>
        {flash === 'earned' && <div className="journal-flash journal-flash--xp">+200 XP awarded!</div>}
        {flash === 'saved'  && <div className="journal-flash">Entry saved.</div>}
        <form onSubmit={handleSubmit}>
          <textarea
            className="journal-textarea"
            placeholder="What did you work on today? How did it feel?"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <div className="journal-submit-row">
            <span className="journal-char-count">{draft.length}/1000</span>
            <button type="submit" className="btn-primary" disabled={!draft.trim() || submitting}>
              {submitting ? '…' : todayEntry ? 'Update Entry' : 'Submit & Earn XP'}
            </button>
          </div>
        </form>
      </div>

      {pastEntries.length > 0 && (
        <div className="journal-past">
          <h3>Past Entries</h3>
          <div className="journal-list">
            {pastEntries.map(e => (
              <div key={e.date} className="journal-entry">
                <div className="journal-entry-date">
                  {formatDate(e.date)}
                  {e.xp_awarded > 0 && <span className="journal-xp-badge">+{e.xp_awarded} XP</span>}
                </div>
                <p className="journal-entry-text">{e.entry}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Community Page ────────────────────────────────────────────
function CommunityPage({ currentUser }) {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.ok ? r.json() : [])
      .then(setPlayers)
  }, [])

  return (
    <div className="community-page">
      <div className="community-header">
        <h2>Community</h2>
        <p>{players.length} player{players.length !== 1 ? 's' : ''} on FitQuest</p>
      </div>
      <div className="community-list">
        {players.map((p, i) => {
          const level   = Math.floor(p.totalXP / XP_PER_LEVEL) + 1
          const xpIn    = p.totalXP % XP_PER_LEVEL
          const pct     = Math.min((xpIn / XP_PER_LEVEL) * 100, 100)
          const isYou   = p.username === currentUser
          const topCat  = Object.entries(p.categoryXP).sort((a, b) => b[1] - a[1])[0]
          return (
            <div key={p.username} className={`player-card${isYou ? ' player-card--you' : ''}`}>
              <div className="player-rank">#{i + 1}</div>
              <div className="player-info">
                <div className="player-name">
                  {p.username}{isYou && <span className="you-badge">you</span>}
                </div>
                <div className="player-meta">
                  <span className="player-level">LVL {level} · {getRank(level)}</span>
                  <span className="player-build">
                    {topCat[1] > 0 ? `${CAT_ICONS[topCat[0]]} ${topCat[0]} build` : 'No workouts yet'}
                  </span>
                  {(() => { const cls = getClass(p.categoryXP); return (
                    <span className="player-class">
                      {cls ? `${cls.title} ${'★'.repeat(cls.tier)}` : 'Unranked'}
                    </span>
                  ) })()}
                </div>
                <div className="player-bar-track">
                  <div className="player-bar-fill" style={{ width: `${pct}%`, background: CAT_COLORS[topCat[0]]?.bar || '#89CFF0' }} />
                </div>
                <div className="player-xp">{xpIn.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Events / Boss Page ────────────────────────────────────────
function EventsPage({ currentUser }) {
  const [data,    setData]    = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/boss').then(r => r.ok ? r.json() : null),
      fetch('/api/community').then(r => r.ok ? r.json() : []),
    ]).then(([bossData, communityData]) => {
      setData(bossData)
      setPlayers(communityData || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="events-page"><p className="boss-loading">Loading…</p></div>
  if (!data || !data.boss) return <div className="events-page"><p className="boss-loading">No active boss right now.</p></div>

  const { boss, contributors } = data
  const hpPct    = Math.max(0, (boss.current_hp / boss.max_hp) * 100)
  const myDmg    = contributors.find(c => c.username === currentUser)?.damage || 0
  const totalDmg = boss.max_hp - boss.current_hp
  const hpColor  = hpPct > 50 ? '#e53e3e' : hpPct > 25 ? '#dd6b20' : '#c53030'

  // Pad players to 4 slots
  const slots = [...players]
  while (slots.length < 4) slots.push(null)

  return (
    <div className="events-page">
      <div
        className="boss-arena"
        style={{
          backgroundImage: `linear-gradient(160deg, rgba(10,10,24,0.82) 0%, rgba(16,21,46,0.78) 50%, rgba(8,28,54,0.84) 100%), url(/boss.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      >
        <div className="boss-title-row">
          <span className="boss-event-label">⚔️ Community Event</span>
        </div>

        <div className="boss-name-plate">{boss.name}</div>

        <div className="boss-hp-section">
          <div className="boss-hp-label">
            <span>HP</span>
            <span>{boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}</span>
          </div>
          <div className="boss-hp-track">
            <div className="boss-hp-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
          </div>
          <div className="boss-hp-sub">{hpPct.toFixed(1)}% remaining · {totalDmg.toLocaleString()} damage dealt</div>
        </div>

        <div className="boss-your-dmg">
          Your contribution: <strong>{myDmg.toLocaleString()} dmg</strong>
        </div>

        <div className="boss-players">
          {slots.slice(0, 4).map((p, i) => {
            if (!p) return (
              <div key={i} className="boss-player-slot empty">
                <div className="bps-avatar">?</div>
                <div className="bps-name">—</div>
                <div className="bps-level">Lv —</div>
                <div className="bps-bar-track"><div className="bps-bar-fill" style={{ width: '0%' }} /></div>
              </div>
            )
            const totalXP   = p.totalXP || 0
            const level     = Math.floor(totalXP / XP_PER_LEVEL) + 1
            const xpInLevel = totalXP % XP_PER_LEVEL
            const lvPct     = (xpInLevel / XP_PER_LEVEL) * 100
            const isMe      = p.username === currentUser
            return (
              <div key={p.username} className={`boss-player-slot${isMe ? ' me' : ''}`}>
                <div className="bps-avatar">{p.username[0].toUpperCase()}</div>
                <div className="bps-name">{p.username}</div>
                <div className="bps-level">Lv {level}</div>
                <div className="bps-bar-track">
                  <div className="bps-bar-fill" style={{ width: `${lvPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="boss-contributors">
        <h3 className="boss-contrib-title">Damage Board</h3>
        {contributors.length === 0 ? (
          <p className="boss-no-contrib">No damage yet — earn XP to attack!</p>
        ) : (
          <div className="boss-contrib-list">
            {contributors.map((c, i) => {
              const pct = totalDmg > 0 ? (c.damage / totalDmg) * 100 : 0
              return (
                <div key={c.username} className={`boss-contrib-row${c.username === currentUser ? ' you' : ''}`}>
                  <span className="contrib-rank">#{i + 1}</span>
                  <span className="contrib-name">{c.username}{c.username === currentUser ? ' (you)' : ''}</span>
                  <div className="contrib-bar-wrap">
                    <div className="contrib-bar-fill" style={{ width: `${pct}%`, background: hpColor }} />
                  </div>
                  <span className="contrib-dmg">{c.damage.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="boss-hint">Every XP you earn deals damage. Work out to bring it down!</p>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [user,         setUser]         = useState(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [categoryXP,   setCategoryXP]   = useState(DEFAULT_CAT_XP)
  const [workouts,     setWorkouts]     = useState(DEFAULT_WORKOUTS)
  const [completed,    setCompleted]    = useState([])
  const [activeCategory, setActiveCategory] = useState('Strength')
  const [levelUp,      setLevelUp]      = useState(null)
  const [page,         setPage]         = useState('dashboard')
  const [showWelcome,  setShowWelcome]  = useState(false)
  const [todayRun,     setTodayRun]     = useState(null)
  const [strengthDay,  setStrengthDay]  = useState(0)
  const [viewDate,     setViewDate]     = useState(todayKey())

  const totalXP = Object.values(categoryXP).reduce((a, b) => a + b, 0)

  // On mount: check session, then load state
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUser(data)
          return loadState()
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  // Reload completions when date changes
  useEffect(() => {
    if (!user) return
    if (viewDate === todayKey()) {
      loadState()
    } else {
      fetch(`/api/completed?date=${viewDate}`)
        .then(r => r.ok ? r.json() : [])
        .then(setCompleted)
    }
  }, [viewDate])

  async function loadState() {
    const res = await fetch('/api/state')
    if (!res.ok) return
    const state = await res.json()
    setCategoryXP(state.categoryXP)
    setCompleted(state.completed)
    setTodayRun(state.todayRun || null)
    // Merge custom workouts on top of defaults
    const merged = {}
    for (const cat of CATEGORIES) {
      merged[cat] = [...DEFAULT_WORKOUTS[cat], ...(state.workouts[cat] || [])]
    }
    setWorkouts(merged)
  }

  async function handleAuth(userData) {
    setUser(userData)
    await loadState()
    if (userData.isNew) setShowWelcome(true)
  }

  async function handleComplete(workoutId, category) {
    const id = String(workoutId)
    if (completed.includes(id)) return
    const oldLvl = Math.floor(totalXP / XP_PER_LEVEL) + 1
    // Optimistic update
    setCompleted(p => [...p, id])
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId, category, date: viewDate }),
      })
      if (res.ok) {
        const data = await res.json()
        const newTotal = Object.values(data.categoryXP).reduce((a, b) => a + b, 0)
        const newLvl   = Math.floor(newTotal / XP_PER_LEVEL) + 1
        setCategoryXP(data.categoryXP)
        if (newLvl > oldLvl) setLevelUp(newLvl)
      }
    } catch {
      // revert optimistic update on failure
      setCompleted(p => p.filter(c => c !== id))
    }
  }

  async function handleAddWorkout(category, workout) {
    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, name: workout.name, desc: workout.desc }),
      })
      if (res.ok) {
        const saved = await res.json()
        setWorkouts(p => ({ ...p, [category]: [...(p[category] || []), saved] }))
      }
    } catch { /* ignore */ }
  }

  async function handleEditWorkout(category, updated) {
    try {
      const res = await fetch(`/api/workouts/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updated.name, desc: updated.desc }),
      })
      if (res.ok) {
        setWorkouts(p => ({
          ...p,
          [category]: p[category].map(w => w.id === updated.id ? updated : w),
        }))
      }
    } catch { /* ignore */ }
  }

  async function handleRun(miles) {
    const oldLvl = Math.floor(totalXP / XP_PER_LEVEL) + 1
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miles }),
      })
      if (res.ok) {
        const data = await res.json()
        const newTotal = Object.values(data.categoryXP).reduce((a, b) => a + b, 0)
        const newLvl   = Math.floor(newTotal / XP_PER_LEVEL) + 1
        setCategoryXP(data.categoryXP)
        setCompleted(p => [...p, 'cardio-run'])
        setTodayRun({ miles: data.miles, xp_awarded: data.xpAwarded })
        if (newLvl > oldLvl) setLevelUp(newLvl)
      }
    } catch { /* ignore */ }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    setUser(null)
    setCategoryXP(DEFAULT_CAT_XP)
    setWorkouts(DEFAULT_WORKOUTS)
    setCompleted([])
    setTodayRun(null)
    setPage('dashboard')
  }

  if (!authChecked) return null
  if (!user) return <AuthScreen onAuth={handleAuth} />

  const xpToday = completed.length * XP_PER_WORKOUT

  return (
    <div className="app">
      {levelUp && <LevelUpToast level={levelUp} onDone={() => setLevelUp(null)} />}

      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-modal" onClick={e => e.stopPropagation()}>
            <div className="welcome-icon">⚡</div>
            <h2>Welcome to FitQuest, {user.username}!</h2>
            <p>Your journey to discover new ways to exercise starts here.</p>
            <ul className="welcome-list">
              <li>Complete workouts to earn <strong>XP</strong></li>
              <li>Level up and climb the <strong>ranks</strong></li>
              <li>Track progress across <strong>4 categories</strong></li>
              <li>Add your own custom workouts</li>
            </ul>
            <button className="btn-primary full" onClick={() => setShowWelcome(false)}>
              Start Training →
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-name">FitQuest</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-link${page === 'dashboard' ? ' active' : ''}`}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-link${page === 'guidebook' ? ' active' : ''}`}
            onClick={() => setPage('guidebook')}
          >
            📖 Guide Book
          </button>
          <button
            className={`nav-link${page === 'community' ? ' active' : ''}`}
            onClick={() => setPage('community')}
          >
            🌍 Community
          </button>
          <button
            className={`nav-link${page === 'journal' ? ' active' : ''}`}
            onClick={() => setPage('journal')}
          >
            📓 Journal
          </button>
          <button
            className={`nav-link${page === 'events' ? ' active' : ''}`}
            onClick={() => setPage('events')}
          >
            ⚔️ Events
          </button>
        </nav>
        {page === 'dashboard' && (
          <CategoryDropdown active={activeCategory} onChange={setActiveCategory} />
        )}
        <button
          className="header-user"
          onClick={() => { if (confirm('Log out?')) handleLogout() }}
          title="Click to log out"
        >
          {user.username}
        </button>
      </header>

      {page === 'community' ? (
        <CommunityPage currentUser={user.username} />
      ) : page === 'journal' ? (
        <JournalPage onXPAwarded={setCategoryXP} />
      ) : page === 'guidebook' ? (
        <GuidebookPage workouts={workouts} onAddToWorkouts={handleAddWorkout} />
      ) : page === 'events' ? (
        <EventsPage currentUser={user.username} />
      ) : (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-inner">
              <h1 className="hero-greeting">Hey, {user.username} 👋</h1>
              {(() => { const cls = getClass(categoryXP); return cls ? (
                <div className="hero-class">
                  <span className="class-icon">{CAT_ICONS[cls.category]}</span>
                  <span className="class-title">{cls.title}</span>
                  <span className="class-tier">{'★'.repeat(cls.tier)}</span>
                </div>
              ) : null })()}
              <p className="hero-sub">
                {completed.length === 0
                  ? 'Pick a category and start earning XP.'
                  : `${completed.length} workout${completed.length !== 1 ? 's' : ''} done today · ${xpToday.toLocaleString()} XP earned`}
              </p>
              <XPBar totalXP={totalXP} />
            </div>
          </section>

          {/* Stat board */}
          <div className="stat-board-wrap">
            <StatBoard categoryXP={categoryXP} activeCategory={activeCategory} onSelect={setActiveCategory} />
          </div>

          {/* Date nav */}
          {(() => {
            const isToday = viewDate === todayKey()
            function navigateDate(dir) {
              setViewDate(d => {
                const date = new Date(d + 'T12:00:00')
                date.setDate(date.getDate() + dir)
                const next = date.toISOString().slice(0, 10)
                if (next > todayKey()) return d
                const limit = new Date(); limit.setDate(limit.getDate() - 7)
                if (next < limit.toISOString().slice(0, 10)) return d
                return next
              })
            }
            const label = isToday ? 'Today' : new Date(viewDate + 'T12:00:00')
              .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            return (
              <div className="date-nav-bar">
                <button className="date-nav-arrow" onClick={() => navigateDate(-1)}>←</button>
                <span className={`date-nav-label${isToday ? '' : ' date-nav-past'}`}>{label}</span>
                <button className="date-nav-arrow" onClick={() => navigateDate(1)} disabled={isToday}>→</button>
              </div>
            )
          })()}

          {/* Workout panel */}
          <main className="main-panel">
            <WorkoutPanel
              category={activeCategory}
              workouts={workouts}
              completed={completed}
              onComplete={handleComplete}
              onAddWorkout={handleAddWorkout}
              onEditWorkout={handleEditWorkout}
              onRun={handleRun}
              todayRun={todayRun}
              strengthDay={strengthDay}
              onCycleStrengthDay={dir => setStrengthDay(d => (d + dir + 3) % 3)}
            />
          </main>

          <footer className="app-footer">
            {XP_PER_WORKOUT} XP per workout · {XP_PER_LEVEL.toLocaleString()} XP per level · Completions reset daily
          </footer>
        </>
      )}
    </div>
  )
}
