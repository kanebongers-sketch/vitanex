import { notFound } from 'next/navigation'

// Elk adres onder /aiyourgym zonder eigen pagina (op aiyourgym.com: elk onbekend
// adres, src/proxy.ts herschrijft daar naar /aiyourgym/...). Zo komt de bezoeker
// op de 404 van AI Your Gym (../../not-found.tsx) binnen de eigen root layout,
// en niet op de algemene src/app/global-not-found.tsx.
export default function OnbekendAdres(): never {
  notFound()
}
