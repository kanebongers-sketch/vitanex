import Link from 'next/link'
import { ArrowRight, CalendarDays, Dumbbell, QrCode } from 'lucide-react'
import { AppHome, AppLessen, AppSchema } from '@/components/aiyourgym/mockups/AppSchermen'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad } from '@/components/aiyourgym/site/paden'

// De ledenapp als blikvanger: drie telefoons (lessen, home met de QR-code,
// het schema) en de drie dingen die een lid er elke week mee doet. Alles
// over de app staat op /ledenapp.

const PUNTEN = [
  { Icoon: CalendarDays, titel: 'Reserveren', tekst: 'Lessen met vrije plekken boeken en annuleren, met een wachtlijst bij een volle les.' },
  { Icoon: QrCode, titel: 'Inchecken met QR', tekst: 'De QR-code staat op het startscherm. Telefoon tonen bij binnenkomst en het lid is binnen.' },
  { Icoon: Dumbbell, titel: 'Eigen schema', tekst: 'Het schema van de trainer met coaching bij elke oefening. Sets afvinken op de vloer.' },
] as const

export function Ledenapp() {
  return (
    <section className="ayg-sectie ayg-ledenapp" aria-labelledby="ledenapp-titel">
      <div className="ayg-wrap ayg-ledenapp-raster">
        <SectieKop
          id="ledenapp-titel"
          label="Ledenapp"
          titel={
            <>
              Reserveren, inchecken, trainen. <mark className="ayg-markeer">Een app.</mark>
            </>
          }
          tekst="In de naam en kleuren van je sportschool. Leden zetten hem met een tik op hun beginscherm, zonder app store."
        />
        <div className="ayg-ledenapp-meer">
          <ul className="ayg-ledenapp-punten">
            {PUNTEN.map(({ Icoon, titel, tekst }) => (
              <li key={titel}>
                <Icoon aria-hidden />
                <div>
                  <h3>{titel}</h3>
                  <p>{tekst}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href={aygPad('/ledenapp')} className="ayg-pijllink">
            Alles over de ledenapp <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="ayg-ledenapp-podium">
          <div
            className="ayg-ledenapp-beeld aygm"
            role="img"
            aria-label="De ledenapp op drie telefoons: het lesrooster met reserveren en wachtlijst, het startscherm met de volgende les en de QR-code om in te checken, en het eigen schema met afgevinkte oefeningen"
          >
            <Toestel tab="Lessen" className="ayg-ledenapp-toestel ayg-ledenapp-toestel--links">
              <AppLessen />
            </Toestel>
            <Toestel tab="Schema" className="ayg-ledenapp-toestel ayg-ledenapp-toestel--rechts">
              <AppSchema />
            </Toestel>
            <Toestel tab="Home" className="ayg-ledenapp-toestel ayg-ledenapp-toestel--midden">
              <AppHome />
            </Toestel>
          </div>
          <p className="ayg-ledenapp-bijschrift">Schermvoorbeeld met voorbeeldgegevens</p>
        </div>
      </div>
    </section>
  )
}
