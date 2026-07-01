'use client'

export type EmotionState = 'calm' | 'focused' | 'proud' | 'concerned' | 'motivated' | 'curious' | 'supportive'

interface Props {
  emotion?: EmotionState
  size?: number
  animate?: boolean
}

type ExpressionConfig = {
  leftSclera:  [number, number, number, number]
  rightSclera: [number, number, number, number]
  leftPupil:   { r: number; dy: number }
  rightPupil:  { r: number; dy: number }
  mouth:       string
  mouthStroke: string
  leftBrow?:   string
  rightBrow?:  string
  eyesClosed?: boolean
  blushOpacity: number
}

const EXPRESSIONS: Record<EmotionState, ExpressionConfig> = {
  calm: {
    leftSclera:  [20, 27, 4.5, 4.5],
    rightSclera: [36, 27, 4.5, 4.5],
    leftPupil:   { r: 2.8, dy: 1 },
    rightPupil:  { r: 2.8, dy: 1 },
    mouth:       'M 23 41 Q 28 45.5 33 41',
    mouthStroke: '#bbb',
    blushOpacity: 0.35,
  },
  focused: {
    leftSclera:  [20, 27, 4.5, 2.8],
    rightSclera: [36, 27, 4.5, 2.8],
    leftPupil:   { r: 2.0, dy: 0 },
    rightPupil:  { r: 2.0, dy: 0 },
    mouth:       'M 23 41 Q 28 42.5 33 41',
    mouthStroke: '#999',
    leftBrow:    'M 15 22 L 23 21',
    rightBrow:   'M 33 21 L 41 22',
    blushOpacity: 0.1,
  },
  proud: {
    leftSclera:  [20, 26, 5, 5],
    rightSclera: [36, 26, 5, 5],
    leftPupil:   { r: 3, dy: -0.5 },
    rightPupil:  { r: 3, dy: -0.5 },
    mouth:       'M 21 40 Q 28 47 35 40',
    mouthStroke: '#aaa',
    leftBrow:    'M 14 20 Q 19 16 24 18',
    rightBrow:   'M 32 18 Q 37 16 42 20',
    blushOpacity: 0.55,
  },
  concerned: {
    leftSclera:  [20, 27, 4.5, 4.5],
    rightSclera: [36, 27, 4.5, 4.5],
    leftPupil:   { r: 2.8, dy: 1 },
    rightPupil:  { r: 2.8, dy: 1 },
    mouth:       'M 23 43 Q 28 39 33 43',
    mouthStroke: '#ccc',
    leftBrow:    'M 13 23 Q 17 20 23 22',
    rightBrow:   'M 33 22 Q 39 20 43 23',
    blushOpacity: 0.15,
  },
  motivated: {
    leftSclera:  [20, 26, 5.5, 5.5],
    rightSclera: [36, 26, 5.5, 5.5],
    leftPupil:   { r: 3.2, dy: 0 },
    rightPupil:  { r: 3.2, dy: 0 },
    mouth:       'M 20 39 Q 28 47.5 36 39',
    mouthStroke: '#aaa',
    leftBrow:    'M 13 18 Q 19 14 25 16',
    rightBrow:   'M 31 16 Q 37 14 43 18',
    blushOpacity: 0.55,
  },
  curious: {
    leftSclera:  [20, 26, 5.5, 5.5],
    rightSclera: [36, 28, 3.5, 3.5],
    leftPupil:   { r: 3.2, dy: 0.5 },
    rightPupil:  { r: 2.0, dy: 0.5 },
    mouth:       'M 23 41 Q 28 44 33 41',
    mouthStroke: '#bbb',
    leftBrow:    'M 13 18 Q 19 14 24 17',
    rightBrow:   'M 33 22 L 41 23',
    blushOpacity: 0.35,
  },
  supportive: {
    leftSclera:  [20, 27, 4.5, 4.5],
    rightSclera: [36, 27, 4.5, 4.5],
    leftPupil:   { r: 2.8, dy: 1 },
    rightPupil:  { r: 2.8, dy: 1 },
    mouth:       'M 21 40 Q 28 46 35 40',
    mouthStroke: '#bbb',
    eyesClosed:  true,
    blushOpacity: 0.5,
  },
}

export default function PandaFace({ emotion = 'calm', size = 56, animate = false }: Props) {
  const exp = EXPRESSIONS[emotion]
  const [lx, ly, lrx, lry] = exp.leftSclera
  const [rx, ry, rrx, rry] = exp.rightSclera

  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        @keyframes panda-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.02); }
        }
        @keyframes panda-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          95%           { transform: scaleY(0.08); }
        }
        /* Zachte idle-blik: de pupillen dwalen heel subtiel — geeft leven,
           zonder af te leiden. Alleen transform, en uit bij reduced-motion. */
        @keyframes panda-gaze {
          0%, 100% { transform: translate(0, 0); }
          30%      { transform: translate(0.6px, 0.3px); }
          65%      { transform: translate(-0.6px, 0.2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .panda-gaze { animation: none !important; }
        }
      `}</style>

      <g
        style={
          animate
            ? { animation: 'panda-breathe 3s ease-in-out infinite', transformOrigin: '28px 28px' }
            : undefined
        }
      >
        {/* Ears outer */}
        <circle cx={13} cy={13} r={10} fill="#1a1a1a" />
        <circle cx={43} cy={13} r={10} fill="#1a1a1a" />
        {/* Ears inner */}
        <circle cx={13} cy={13} r={5} fill="#2e2e2e" />
        <circle cx={43} cy={13} r={5} fill="#2e2e2e" />

        {/* Face */}
        <circle cx={28} cy={31} r={22} fill="white" />

        {/* Eye patches */}
        <ellipse cx={19} cy={27} rx={8.5} ry={8} fill="#1a1a1a" />
        <ellipse cx={37} cy={27} rx={8.5} ry={8} fill="#1a1a1a" />

        {/* Eyes */}
        {exp.eyesClosed ? (
          <>
            <path
              d="M 15 27 Q 19 23 24 27"
              stroke="#1a1a1a"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 32 27 Q 36 23 41 27"
              stroke="#1a1a1a"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Sclera's blijven staan; alleen de pupillen + catchlight dwalen mee
                in de idle-blik, zodat de blik nooit buiten het oog valt. */}
            <ellipse cx={lx} cy={ly} rx={lrx} ry={lry} fill="white" />
            <ellipse cx={rx} cy={ry} rx={rrx} ry={rry} fill="white" />

            <g
              className={animate ? 'panda-gaze' : undefined}
              style={
                animate
                  ? { animation: 'panda-gaze 7s ease-in-out infinite', transformOrigin: '28px 27px' }
                  : undefined
              }
            >
              {/* Left pupil + catchlight */}
              <circle cx={lx} cy={ly + exp.leftPupil.dy} r={exp.leftPupil.r} fill="#1a1a1a" />
              <circle cx={lx + 1.5} cy={ly + exp.leftPupil.dy - 1.5} r={1.1} fill="white" />
              <circle cx={lx - 1} cy={ly + exp.leftPupil.dy + 1.2} r={0.5} fill="white" opacity={0.6} />

              {/* Right pupil + catchlight */}
              <circle cx={rx} cy={ry + exp.rightPupil.dy} r={exp.rightPupil.r} fill="#1a1a1a" />
              <circle cx={rx + 1.5} cy={ry + exp.rightPupil.dy - 1.5} r={1.1} fill="white" />
              <circle cx={rx - 1} cy={ry + exp.rightPupil.dy + 1.2} r={0.5} fill="white" opacity={0.6} />
            </g>
          </>
        )}

        {/* Eyebrows */}
        {exp.leftBrow && (
          <path
            d={exp.leftBrow}
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        )}
        {exp.rightBrow && (
          <path
            d={exp.rightBrow}
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Nose */}
        <ellipse cx={28} cy={37} rx={3} ry={2.2} fill="#1a1a1a" />

        {/* Mouth */}
        <path
          d={exp.mouth}
          stroke={exp.mouthStroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />

        {/* Blush */}
        <ellipse cx={11} cy={37} rx={5.5} ry={3} fill="#ff8fab" opacity={exp.blushOpacity} />
        <ellipse cx={45} cy={37} rx={5.5} ry={3} fill="#ff8fab" opacity={exp.blushOpacity} />
      </g>
    </svg>
  )
}
