import { redirect } from 'next/navigation'

// Legacy medewerker-portaal. De functionaliteit leeft verder in /home
// (dagstart), /rapport (analyses) en /bestanden (documenten); oude links
// en bookmarks komen hier nog binnen en worden doorgestuurd.
export default function PortaalPage() {
  redirect('/home')
}
