'use client'

import { useState } from 'react'

interface MicroLearningProps {
  domein: string
  score: number
}

type TipRecord = {
  tip: string
  actie: string
  duur: string
}

const TIPS: Record<string, TipRecord[]> = {
  slaap: [
    {
      tip: 'Consistent opstaan op hetzelfde tijdstip helpt je bioritme meer dan vroeger naar bed gaan.',
      actie: 'Stel voor de komende week elke ochtend hetzelfde wektijdstip in.',
      duur: '1 min',
    },
    {
      tip: 'Schermverduistering 60 minuten voor slapen verlaagt je cortisolniveau merkbaar.',
      actie: 'Activeer Nachtmodus op je telefoon en zet hem om 22:00 uur weg.',
      duur: '2 min',
    },
  ],
  stress: [
    {
      tip: 'Drie diepe ademhalingen activeren je parasympatisch zenuwstelsel binnen 30 seconden.',
      actie: 'Adem 4 tellen in, 4 vasthouden, 6 uitademen — drie keer nu.',
      duur: '30 sec',
    },
    {
      tip: 'Microbreaks van 90 seconden voorkomen stressaccumulatie door de dag heen.',
      actie: 'Stel elk uur een timer in voor een korte pauze van anderhalve minuut.',
      duur: '2 min',
    },
  ],
  energie: [
    {
      tip: 'Dehydratatie van 1-2% verlaagt concentratie en energieniveau merkbaar.',
      actie: 'Drink nu een groot glas water en zet een waterfles op je bureau.',
      duur: '1 min',
    },
    {
      tip: 'Een korte wandeling van 10 minuten verhoogt je energieniveau voor 2 uur.',
      actie: 'Plan vandaag een blokje om na de lunch in je agenda.',
      duur: '1 min',
    },
  ],
  focus: [
    {
      tip: 'Notificaties uitzetten verhoogt je diepe werktijd gemiddeld met 23%.',
      actie: 'Zet meldingen uit voor de komende 25 minuten en werk aan één taak.',
      duur: '25 min',
    },
    {
      tip: 'Je prefrontale cortex werkt het best in de eerste 2 uur na opstaan.',
      actie: 'Plan morgen je moeilijkste taak in als allereerste van de dag.',
      duur: '1 min',
    },
  ],
  balans: [
    {
      tip: 'Een duidelijk eindmoment voor werk geeft je hersenen toestemming om te ontspannen.',
      actie: 'Stel vandaag een vasttijdstip in als "werkdag-afsluiting" en houd het vast.',
      duur: '1 min',
    },
    {
      tip: 'Kleine rituelen bij de overgang werk-privé verlagen je cortisol sneller.',
      actie: 'Bedenk één ritueel (wandeling, douche, thee) voor na het werk.',
      duur: '2 min',
    },
  ],
  motivatie: [
    {
      tip: 'Zingeving in dagelijkse taken verhoogt intrinsieke motivatie meer dan beloningen.',
      actie: 'Schrijf één zin op waarom jouw werk vandaag iemand helpt.',
      duur: '2 min',
    },
    {
      tip: 'Kleine overwinningen boeken versterkt de dopaminecyclus die motivatie aandrijft.',
      actie: 'Zet één kleine, haalbare taak bovenaan je lijst en doe die als eerste.',
      duur: '5 min',
    },
  ],
}

export default function MicroLearning({ domein, score }: MicroLearningProps) {
  const pct = Math.round(((score - 4) / 16) * 100)
  const [bekeken, setBekeken] = useState(false)

  const beschikbaar = TIPS[domein] ?? []
  if (!beschikbaar.length) return null

  const dagIndex = new Date().getDay() % beschikbaar.length
  const tip = beschikbaar[dagIndex]

  const domeinLabels: Record<string, string> = {
    slaap: 'Slaap', stress: 'Stress', energie: 'Energie',
    focus: 'Focus', balans: 'Balans', motivatie: 'Motivatie',
  }

  return (
    <article
      className="micro-learning"
      aria-label={`Dagelijkse tip voor ${domeinLabels[domein] ?? domein}`}
    >
      <header className="micro-learning__header">
        <span className="micro-learning__label">Dagelijkse tip</span>
        <span className="micro-learning__domein">
          {domeinLabels[domein] ?? domein} — {pct}%
        </span>
        <span className="micro-learning__duur">{tip.duur}</span>
      </header>

      <p className="micro-learning__tip">{tip.tip}</p>

      {!bekeken ? (
        <button
          className="micro-learning__actie-btn"
          onClick={() => setBekeken(true)}
          type="button"
        >
          Toon mijn actie
        </button>
      ) : (
        <div className="micro-learning__actie">
          <span className="micro-learning__actie-icon">→</span>
          <p>{tip.actie}</p>
        </div>
      )}
    </article>
  )
}
