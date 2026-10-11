import { SITE } from "@rv/config/site";
import type { LegalDocument } from "@rv/components/legal/LegalPage";
import { COMPANY_IDENTITY, LEGAL_UPDATED } from "./shared";

/**
 * ALGEMENE VOORWAARDEN — concept voor een Nederlandse webshop (B2C, NL en BE).
 * Gebaseerd op de wettelijke regels voor koop op afstand (Boek 6 en 7 BW).
 * Laat dit controleren door een jurist voor livegang.
 */
const days = SITE.shipping.returnDays;

export const ALGEMENE_VOORWAARDEN: LegalDocument = {
  path: "/algemene-voorwaarden",
  title: "Algemene voorwaarden",
  description: `De algemene voorwaarden van ${SITE.brandName}: aanbod, prijzen, betaling, levering, herroepingsrecht, garantie en klachten.`,
  intro: `Deze voorwaarden gelden voor elke bestelling bij ${SITE.brandName}. We hebben ze zo helder mogelijk opgeschreven. Heb je een vraag over een artikel? Neem dan gerust contact met ons op.`,
  updated: LEGAL_UPDATED,
  sections: [
    {
      id: "identiteit",
      title: "Identiteit van de ondernemer",
      blocks: [
        { kind: "p", text: `De webshop ${SITE.brandName} wordt geëxploiteerd door:` },
        COMPANY_IDENTITY,
        { kind: "p", text: `Bereikbaarheid: per e-mail op werkdagen. ${SITE.contact.responseTime}` },
      ],
    },
    {
      id: "definities",
      title: "Definities",
      blocks: [
        {
          kind: "definitions",
          items: [
            { term: "Ondernemer", description: `${SITE.company.legalName}, handelend onder de naam ${SITE.brandName}.` },
            { term: "Consument", description: "De natuurlijke persoon die niet handelt voor doeleinden die verband houden met zijn handels-, bedrijfs-, ambachts- of beroepsactiviteit." },
            { term: "Overeenkomst", description: "De koopovereenkomst op afstand tussen ondernemer en consument, gesloten via de webshop." },
            { term: "Bedenktijd", description: `De termijn van ${days} dagen waarbinnen de consument gebruik kan maken van het herroepingsrecht.` },
            { term: "Digitale inhoud", description: "Het videoprogramma ‘14 dagen herstel’ dat via een QR-code bij het product toegankelijk is." },
            { term: "Duurzame gegevensdrager", description: "Elk middel, zoals e-mail, waarmee informatie op een ongewijzigde manier kan worden opgeslagen en geraadpleegd." },
          ],
        },
      ],
    },
    {
      id: "toepasselijkheid",
      title: "Toepasselijkheid",
      blocks: [
        { kind: "p", text: "Deze algemene voorwaarden zijn van toepassing op elk aanbod van de ondernemer en op elke overeenkomst die via de webshop tot stand komt." },
        { kind: "p", text: "Voordat de overeenkomst wordt gesloten, wordt de tekst van deze voorwaarden aan de consument beschikbaar gesteld via de website. Op verzoek sturen we ze kosteloos per e-mail toe, zodat de consument ze kan opslaan." },
        { kind: "p", text: "Als een bepaling uit deze voorwaarden nietig is of vernietigd wordt, blijven de overige bepalingen van kracht. De ondernemer vervangt de betreffende bepaling dan door een bepaling die de oorspronkelijke bedoeling zo dicht mogelijk benadert." },
      ],
    },
    {
      id: "aanbod",
      title: "Het aanbod",
      blocks: [
        { kind: "p", text: "Het aanbod bevat een volledige en nauwkeurige omschrijving van het product en de bijbehorende digitale inhoud. Afbeeldingen geven het product zo getrouw mogelijk weer; kleine afwijkingen in kleur of verpakking zijn mogelijk en geven geen recht op schadevergoeding of ontbinding." },
        { kind: "p", text: "Kennelijke vergissingen of fouten in het aanbod, zoals een duidelijk onjuiste prijs, binden de ondernemer niet." },
        { kind: "p", text: "Het aanbod geldt zolang de voorraad strekt. Is een product niet meer leverbaar, dan laten we dat zo snel mogelijk weten en betalen we een eventueel al betaald bedrag volledig terug." },
      ],
    },
    {
      id: "overeenkomst",
      title: "De overeenkomst",
      blocks: [
        { kind: "p", text: "De overeenkomst komt tot stand op het moment dat de consument de bestelling plaatst en de betaling is voltooid." },
        { kind: "p", text: "De ondernemer bevestigt de ontvangst van de bestelling direct per e-mail. Zolang deze bevestiging niet is ontvangen, kan de consument de overeenkomst ontbinden." },
        { kind: "p", text: "Uiterlijk bij de levering ontvangt de consument op een duurzame gegevensdrager: het bezoekadres voor klachten, de voorwaarden voor het herroepingsrecht (inclusief het modelformulier), informatie over garantie en service, en de prijs inclusief alle belastingen." },
      ],
    },
    {
      id: "prijzen",
      title: "Prijzen",
      blocks: [
        { kind: "p", text: "Alle prijzen op de website zijn in euro’s en inclusief btw. Verzendkosten worden voor het afronden van de bestelling duidelijk vermeld." },
        { kind: "p", text: `${SITE.shipping.freeLabel}. Voor levering buiten Nederland en België is bestellen op dit moment niet mogelijk.` },
        { kind: "p", text: "Gedurende de looptijd van het aanbod worden de prijzen niet verhoogd, behalve bij prijswijzigingen door wettelijke regelingen, zoals een wijziging van het btw-tarief." },
      ],
    },
    {
      id: "betaling",
      title: "Betaling",
      blocks: [
        { kind: "p", text: "Betalen gebeurt vooraf, bij het plaatsen van de bestelling. Je kunt kiezen uit de volgende betaalmethoden:" },
        { kind: "list", items: ["iDEAL", "Bancontact", "Creditcard (onder andere Visa en Mastercard), ook via Apple Pay en Google Pay", "Klarna (achteraf betalen, onder de voorwaarden van Klarna)"] },
        { kind: "p", text: "Betalingen worden veilig verwerkt door onze betaalprovider Stripe. De ondernemer ontvangt en bewaart geen volledige betaalkaartgegevens." },
        { kind: "p", text: "Onjuistheden in verstrekte of vermelde betaalgegevens moet de consument zo snel mogelijk aan de ondernemer melden." },
      ],
    },
    {
      id: "levering",
      title: "Levering en uitvoering",
      blocks: [
        { kind: "p", text: `We leveren in Nederland en België. ${SITE.shipping.deliveryLabel} na ontvangst van de betaling, tenzij anders vermeld. Uiterlijk binnen 30 dagen na de bestelling wordt geleverd.` },
        { kind: "p", text: "Het adres dat de consument bij de bestelling opgeeft, geldt als leveradres. Lukt de levering niet of later dan afgesproken, dan krijgt de consument daarvan bericht en heeft hij het recht de overeenkomst kosteloos te ontbinden. Een al betaald bedrag wordt dan binnen 14 dagen terugbetaald." },
        { kind: "p", text: "Het risico van beschadiging of vermissing van het product ligt bij de ondernemer tot het moment van bezorging bij de consument, of bij een vooraf aangewezen en aan de ondernemer bekendgemaakte derde, tenzij uitdrukkelijk anders is overeengekomen." },
        { kind: "p", text: "Toegang tot het videoprogramma wordt geleverd via de QR-kaart in de doos. Een account is niet nodig." },
      ],
    },
    {
      id: "herroepingsrecht",
      title: "Herroepingsrecht",
      blocks: [
        { kind: "p", text: `De consument kan de overeenkomst gedurende een bedenktijd van ${days} dagen zonder opgave van redenen ontbinden. De bedenktijd gaat in op de dag nadat de consument, of een door hem aangewezen derde, het product heeft ontvangen.` },
        { kind: "p", text: "Tijdens de bedenktijd gaat de consument zorgvuldig om met het product en de verpakking. Hij pakt het product alleen uit of gebruikt het in de mate die nodig is om de aard, de kenmerken en de werking vast te stellen, zoals in een winkel. Bij verdergaand gebruik kan de consument aansprakelijk zijn voor de waardevermindering." },
        { kind: "p", text: `Wil de consument gebruikmaken van het herroepingsrecht, dan meldt hij dit binnen de bedenktijd via het modelformulier of op een andere ondubbelzinnige manier. Daarna stuurt hij het product binnen ${days} dagen terug. De volledige werkwijze staat in ons retourbeleid.` },
        { kind: "p", text: `De ondernemer betaalt alle betalingen van de consument, inclusief de standaard leveringskosten, uiterlijk binnen ${days} dagen na de melding terug. De ondernemer mag wachten met terugbetalen tot hij het product heeft ontvangen of de consument aantoont dat het is teruggestuurd. Terugbetaling gebeurt via dezelfde betaalmethode.` },
        { kind: "p", text: "De directe kosten van het terugzenden komen voor rekening van de consument, tenzij in het retourbeleid anders is vermeld." },
      ],
    },
    {
      id: "garantie",
      title: "Conformiteit en garantie",
      blocks: [
        { kind: "p", text: "De ondernemer staat ervoor in dat het product voldoet aan de overeenkomst, de in het aanbod vermelde specificaties en de redelijke eisen van deugdelijkheid en bruikbaarheid." },
        { kind: "p", text: "De consument heeft altijd recht op de wettelijke garantie. Is het product niet in orde, dan heeft de consument recht op herstel of vervanging, en als dat niet mogelijk of redelijk is, op prijsverlaging of ontbinding." },
        { kind: "p", text: "Normale slijtage door gebruik, zoals vervorming van foam of verlies van spanning van de stretchband na intensief gebruik, en schade door onjuist gebruik vallen niet onder de conformiteit." },
        { kind: "p", text: "De tools en het videoprogramma zijn bedoeld voor herstel, mobiliteit en comfort. Ze zijn geen medisch hulpmiddel en geen vervanging van medisch advies." },
      ],
    },
    {
      id: "klachten",
      title: "Klachten",
      blocks: [
        { kind: "p", text: `Klachten over de uitvoering van de overeenkomst moeten binnen bekwame tijd nadat de consument de gebreken heeft ontdekt, volledig en duidelijk omschreven worden gemeld via ${SITE.contact.email}.` },
        { kind: "p", text: "Bij de ondernemer ingediende klachten worden binnen 14 dagen na ontvangst beantwoord. Vraagt een klacht meer tijd, dan ontvangt de consument binnen 14 dagen een ontvangstbevestiging en een indicatie van wanneer hij een uitgebreider antwoord kan verwachten." },
      ],
    },
    {
      id: "geschillen",
      title: "Geschillen",
      blocks: [
        { kind: "p", text: "Komen we er samen niet uit, dan kan de consument zich wenden tot een geschillencommissie of de bevoegde rechter. Is de ondernemer aangesloten bij een geschillencommissie of keurmerk, dan wordt dat hier vermeld: [GESCHILLENCOMMISSIE / KEURMERK, INDIEN VAN TOEPASSING]." },
        { kind: "p", text: "Consumenten in België kunnen zich daarnaast wenden tot de Consumentenombudsdienst (consumentenombudsdienst.be)." },
      ],
    },
    {
      id: "toepasselijk-recht",
      title: "Toepasselijk recht",
      blocks: [
        { kind: "p", text: "Op overeenkomsten tussen de ondernemer en de consument is uitsluitend Nederlands recht van toepassing." },
        { kind: "p", text: "Woont de consument in België, dan behoudt hij de bescherming die de dwingende bepalingen van het Belgische consumentenrecht hem bieden." },
      ],
    },
  ],
};
