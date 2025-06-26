import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LandingFooter from "@/components/landing/footer"
import LandingHeader from "@/components/landing/header"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const roadmapData = {
  "Fundamenteel Taakbeheer": [
    { id: 1, title: "Taakcreatie & Eigenschappen", description: "Prioriteit, herhalende taken, labels/categorieën, toewijzing, deadlines.", completed: true },
    { id: 2, title: "Taakstatussen & Workflow", description: "Configureerbare statussen met kleurcodering.", completed: true },
    { id: 3, title: "Subtaken (Sub-tasks)", description: "Hiërarchische, afvinkbare subtaken.", completed: true },
    { id: 4, title: "Taakafhankelijkheden", description: "Voorkom dat 'B' start voor 'A' klaar is.", completed: true },
    { id: 5, title: "Taaktemplates", description: "Voor terugkerende processen.", completed: true },
    { id: 6, title: "Bestands- & Linkbijlagen", description: "Voeg bewijs of documenten toe.", completed: true },
    { id: 7, title: "Persoonlijke Taken & Zichtbaarheid", description: "Taken alleen voor de gebruiker zelf.", completed: true },
    { id: 8, title: "Historie & Logging", description: "Volledige taakgeschiedenis en auditlog.", completed: true },
    { id: 9, title: "Taak Klonen", description: "Dupliceer taken efficiënt.", completed: true },
    { id: 10, title: "Bulk Taakoperaties", description: "Bewerk meerdere taken tegelijk in het webdashboard.", completed: true },
    { id: 12, title: "Geavanceerde Terugkerende Taken", description: "Complexe patronen (bv. 'elke 3e donderdag van de maand').", completed: true },
    { id: 14, title: "Handmatige Taakvolgorde", description: "Sleep taken in de gewenste volgorde binnen een lijst.", completed: true },
    { id: 13, title: "Recycle Bin / Prullenbak", description: "Herstel per ongeluk verwijderde taken binnen een bepaalde periode.", completed: true },
    { id: 11, title: "Persoonlijke Herinneringen (/remindme)", description: "Vraag de bot om je ergens aan te herinneren.", completed: true },
    { id: 15, title: "Custom Fields", description: "Voeg eigen velden toe aan taken (bv. 'Klant ID', 'Locatie').", completed: false },
    { id: 16, title: "Rich Text Editor", description: "Opmaakmogelijkheden (vet, cursief, lijsten) in beschrijvingen en comments.", completed: false },
    { id: 17, title: "Batch Bewerken van Subtaken", description: "Meerdere subtaken tegelijk aanpassen.", completed: false },
    { id: 18, title: "Taak-specifieke Notificaties", description: "Stel notificaties per taak in.", completed: false },
    { id: 19, title: "Private Comments", description: "Plaats opmerkingen die alleen zichtbaar zijn voor specifieke rollen of gebruikers.", completed: false },
    { id: 20, title: "Mind Map View", description: "Creëer en visualiseer taken in een mindmap-structuur.", completed: false },
    { id: 21, title: "Taak Spiegelen/Koppelen", description: "Een taak in meerdere projecten laten verschijnen, waarbij updates synchroniseren.", completed: false },
  ],
  "Geavanceerd Project- & Resource Management": [
     { id: 22, title: "Task Review & Approval Workflow", description: "Formele goedkeuringsstap voor voltooide taken.", completed: true },
     { id: 23, title: "Effort Estimation (Story Points)", description: "Schat complexiteit in plaats van tijd.", completed: true },
     { id: 24, title: "Gantt Chart View", description: "Visuele tijdlijn-weergave van projecten.", completed: true },
     { id: 25, title: "Actieve Tijdregistratie", description: "/task timer start/stop voor precieze tijdsmeting.", completed: true },
     { id: 27, title: "Skills & Competency Matrix", description: "Tag gebruikers met vaardigheden voor betere toewijzing.", completed: true },
     { id: 26, title: "Workload Capacity Planning", description: "Visualiseer de werkdruk per teamlid.", completed: false },
     { id: 28, title: "Project Milestones", description: "Definieer belangrijke mijlpalen binnen een project.", completed: false },
     { id: 29, title: "Budget & Kostentracking", description: "Houd budgetten en gemaakte kosten bij per project of taak.", completed: false },
     { id: 30, title: "Resource Planning (Niet-menselijk)", description: "Wijs apparatuur of ruimtes toe aan taken.", completed: false },
     { id: 31, title: "Afhankelijkheden Tussen Projecten", description: "Maak hele projecten van elkaar afhankelijk.", completed: false },
     { id: 32, title: "Geavanceerd Template Beheer", description: "Versiebeheer en conditionele logica in templates.", completed: false },
     { id: 33, title: "Project Portfolio Management", description: "Groepeer en beheer gerelateerde projecten als een portfolio.", completed: false },
     { id: 34, title: "Gantt Chart met Critical Path Analysis", description: "Identificeer automatisch het kritieke pad in een project.", completed: false },
     { id: 35, title: "Time Off & Availability Management", description: "Gebruikers kunnen hun afwezigheid aangeven, wat zichtbaar is in de planning.", completed: false },
     { id: 36, title: "Facturatie op basis van Tijdregistratie", description: "Genereer factuurvoorstellen op basis van gelogde tijd.", completed: false },
     { id: 37, title: "Risico Register", description: "Een aparte module per project om risico's te identificeren, te beoordelen en te mitigeren.", completed: false },
     { id: 38, title: "Stakeholder Management", description: "Wijs stakeholders toe aan projecten met specifieke communicatievoorkeuren.", completed: false },
     { id: 39, title: "Project Baselines", description: "'Bevries' een projectplan om de voortgang te meten ten opzichte van het originele plan.", completed: false },
  ],
  "Artificiële Intelligentie & Smart-Functionaliteit": [
    { id: 40, title: "AI Smart Assignment", description: "Stelt de beste persoon voor een taak voor op basis van data.", completed: true },
    { id: 41, title: "AI-Assisted Task Breakdown", description: "Genereert subtaken voor een complexe hoofdtaak.", completed: true },
    { id: 42, title: "AI-Powered Task Summarization", description: "Vat lange discussies in taak-comments samen.", completed: true },
    { id: 43, title: "Natural Language Processing (NLP) voor Taakcreatie", description: "Creëer taken met gewone zinnen.", completed: true },
    { id: 44, title: "Smart Search (Natural Language Query)", description: "Doorzoek de database met complexe vragen.", completed: true },
    { id: 52, title: "AI-Suggested Taakprioritering", description: "Geeft een voorzet voor de prioriteit op basis van inhoud en context.", completed: true },
    { id: 49, title: "AI Voice-to-Task & Voice Control", description: "Dicteer taken en commando's via spraak.", completed: true },
    { id: 45, title: "AI Predictive Analysis & Risk Detection", description: "Waarschuwt proactief voor projectvertragingen.", completed: false },
    { id: 46, title: "AI-Generated Reports", description: "Maak rapporten op basis van een prompt in natuurlijke taal.", completed: false },
    { id: 47, title: "AI-Powered Risico-Identificatie", description: "Analyseert taakteksten op potentiële risicowoorden.", completed: false },
    { id: 48, title: "AI-Suggested Optimal Workflow Paths", description: "Stelt de meest efficiënte status-volgorde voor per taaktype.", completed: false },
    { id: 50, title: "Automatische Detectie van Dubbele Taken", description: "Signaleert mogelijke duplicaten bij aanmaak.", completed: false },
    { id: 51, title: "AI-Powered Sentiment Analyse", description: "Analyseert de toon van de communicatie in comments.", completed: false },
    { id: 53, title: "AI Anomaly Detection", description: "Detecteert ongebruikelijke patronen in de voortgang of tijdregistratie.", completed: false },
  ],
  "Community & Gamification": [
    { id: 54, title: "Beloningssysteem", description: "Experience Points (EXP) en Punten.", completed: true },
    { id: 55, title: "Achievements & Badges", description: "Ontgrendelbare prestaties.", completed: true },
    { id: 56, title: "Leaderboards", description: "Wekelijks/maandelijks, per guild en per team.", completed: true },
    { id: 57, title: "Karma- & Bedanksysteem", description: "Stimuleer positieve interactie.", completed: true },
    { id: 58, title: "'Help Wanted' Board", description: "Vraag om hulp bij specifieke taken.", completed: false },
    { id: 59, title: "Team-Based Challenges & Competities", description: "Stel doelen voor teams met een beloning.", completed: false },
    { id: 60, title: "Skill Endorsements", description: "Gebruikers kunnen elkaars vaardigheden onderschrijven.", completed: false },
    { id: 61, title: "Ideeënbus & Feature Request Voting", description: "Laat gebruikers meebeslissen over de toekomst van Chorey.", completed: false },
    { id: 62, title: "Puntenwinkel", description: "Wissel verdiende punten in voor cosmetische items (bv. profiel-thema's, badge-stijlen).", completed: false },
    { id: 63, title: "Guilds / Clans", description: "Laat gebruikers permanente groepen vormen voor competities en samenwerking.", completed: false },
  ],
  "Het Webdashboard & Gebruikersinterface": [
      { id: 64, title: "Geavanceerd Webdashboard", description: "Het centrale beheerplatform.", completed: true },
      { id: 65, title: "Aanpasbare Dashboard Widgets", description: "Stel je eigen dashboard samen.", completed: true },
      { id: 66, title: "Keyboard Shortcuts (Webdashboard)", description: "Sneltoetsen voor efficiëntie.", completed: true },
      { id: 67, title: "Gebruikersprofielen", description: "Bekijk statistieken en taken van een gebruiker.", completed: true },
      { id: 68, title: "Kalenderweergave / Board View", description: "Kanaal als live Kanban-bord.", completed: true },
      { id: 72, title: "Command Palette (Cmd/Ctrl+K)", description: "Een centrale interface om alles te besturen.", completed: true },
      { id: 74, title: "Aanpasbare Views", description: "Sla persoonlijke kolom- en filterinstellingen op.", completed: true },
      { id: 75, title: "Dark Mode & Theming", description: "Donkere modus en andere kleurenthema's voor de interface.", completed: true },
      { id: 69, title: "Offline Modus (PWA)", description: "Werk offline en synchroniseer later.", completed: false },
      { id: 70, title: "Dedicated Mobile Companion App", description: "Native app voor iOS en Android.", completed: false },
      { id: 71, title: "Meertalige Interface", description: "Ondersteuning voor meerdere talen.", completed: false },
      { id: 73, title: "In-App Onboarding & Feature Tours", description: "Interactieve gidsen voor nieuwe features.", completed: false },
      { id: 76, title: "White-labeling / Custom Branding", description: "Pas het platform aan met eigen logo en kleuren.", completed: false },
      { id: 77, title: "Focus Mode", description: "Een afleidingsvrije interface om te focussen op de huidige taak.", completed: false },
      { id: 78, title: "Toegankelijkheidsverbeteringen (A11y)", description: "Volledige ondersteuning voor screenreaders en toetsenbordnavigatie.", completed: false },
  ],
  "Integraties & API": [
    { id: 79, title: "Data Export (CSV, JSON, etc.)", description: "Migreer van/naar verschillende formaten.", completed: true },
    { id: 80, title: "Google Calendar Integratie", description: "Synchroniseer deadlines met je agenda.", completed: false },
    { id: 81, title: "GitHub Integratie", description: "Koppel taken aan issues en pull requests.", completed: false },
    { id: 82, title: "Exposed REST API voor Ontwikkelaars", description: "Laat derden bouwen op Chorey.", completed: false },
    { id: 83, title: "Microsoft Teams Integratie", description: "Volledige functionaliteit binnen MS Teams.", completed: false },
    { id: 84, title: "Zapier / Make (Integromat) Integratie", description: "Verbind Chorey met duizenden andere apps.", completed: false },
    { id: 85, title: "Cloud Storage Integraties", description: "Koppel bestanden direct vanuit Google Drive, OneDrive, Dropbox.", completed: false },
    { id: 86, title: "Email-to-Task Gateway", description: "Maak taken aan door een e-mail te sturen naar een uniek projectadres.", completed: false },
    { id: 87, title: "Webhooks", description: "Stuur real-time updates naar externe systemen bij gebeurtenissen in Chorey.", completed: false },
  ],
  "Notificaties & Communicatie": [
      { id: 88, title: "Flexibel Notificatiesysteem", description: "Configureerbare kanalen en gebruikersvoorkeuren.", completed: true },
      { id: 89, title: "Dagelijks Overzicht", description: "Configureerbaar kanaal voor dagelijkse updates.", completed: false },
      { id: 90, title: "Notificatie \"Snooze\" Functionaliteit", description: "Stel een notificatie uit.", completed: false },
      { id: 91, title: "Verbeterde @mentions en Taakdiscussies", description: "Rijkere discussies met threads.", completed: false },
      { id: 92, title: "Notificatie Digest", description: "Ontvang een samenvatting (dagelijks/wekelijks) van alle updates.", completed: false },
  ],
   "Veiligheid & Beheer": [
    { id: 93, title: "Geavanceerd Rechtenbeheer (RBAC)", description: "Definieer aangepaste rollen met specifieke permissies.", completed: true },
    { id: 94, title: "Two-Factor Authentication (2FA)", description: "Verbeterde accountbeveiliging.", completed: false },
    { id: 95, title: "Uitgebreide Audit Logs voor Beheerders", description: "Gedetailleerde logging van alle acties.", completed: false },
    { id: 96, title: "Single Sign-On (SSO)", description: "Integratie met SAML, Google, Microsoft.", completed: false },
    { id: 97, title: "Data Residency Opties", description: "Kies de geografische locatie voor dataopslag (bv. EU/VS).", completed: false },
    { id: 98, title: "Gast- / Klanttoegang", description: "Geef externe gebruikers beperkte toegang tot specifieke projecten.", completed: false },
    { id: 99, title: "IP Whitelisting", description: "Beperk toegang tot het platform tot specifieke IP-adressen.", completed: false },
  ],
}


export default function RoadmapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Chorey Roadmap</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Een overzicht van wat we hebben gebouwd en wat de toekomst brengt. We werken constant aan het verbeteren van ons platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl gap-12 py-12">
              {Object.entries(roadmapData).map(([category, features]) => (
                <div key={category} className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight">{category}</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((item) => (
                      <Card key={item.id} className={cn("flex flex-col", item.completed && "bg-background/60 border-green-500/40")}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                          <CardTitle className={cn("text-lg", item.completed && "text-muted-foreground")}>{item.title}</CardTitle>
                          {item.completed && <Check className="h-6 w-6 text-green-500 shrink-0" />}
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className={cn("text-muted-foreground", item.completed && "text-muted-foreground/80")}>{item.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
