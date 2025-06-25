import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LandingFooter from "@/components/landing/footer"
import LandingHeader from "@/components/landing/header"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const roadmapData = {
  "Fundamenteel Taakbeheer": [
    { id: 1, title: "Taakcreatie & Eigenschappen", description: "Prioriteit (Low, Medium, High, Urgent), herhalende taken, labels/categorieën, toewijzing, deadlines.", completed: true },
    { id: 2, title: "Taakstatussen & Workflow", description: "Configureerbare statussen (TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED, ARCHIVED) met kleurcodering.", completed: true },
    { id: 3, title: "Subtaken (Sub-tasks)", description: "Hiërarchische, afvinkbare subtaken voor complexe opdrachten.", completed: true },
    { id: 4, title: "Taakafhankelijkheden", description: "Voorkom dat 'dweilen' wordt gestart voordat 'stofzuigen' is voltooid.", completed: true },
    { id: 6, title: "Bestands- & Linkbijlagen", description: "Voeg foto's ('bewijs van schoonmaak') of documenten toe.", completed: true },
    { id: 7, title: "Persoonlijke Taken & Zichtbaarheid", description: "Taken die alleen voor de gebruiker zelf zichtbaar zijn.", completed: true },
    { id: 9, title: "Historie & Logging", description: "Volledige taakgeschiedenis, auditlog voor wijzigingen, en deadline waarschuwingen.", completed: true },
    { id: 10, title: "Taak Klonen & Samenvoegen", description: "Dupliceer of merge taken efficiënt.", completed: true },
    { id: 12, title: "Bulk Taakoperaties", description: "Selecteer en bewerk meerdere taken tegelijk in het webdashboard.", completed: true },
    { id: 5, title: "Taaktemplates", description: "Voor 'Wekelijkse Huis-Reset' of 'Onboarding Nieuwe Medewerker'.", completed: false },
    { id: 8, title: "Persoonlijke Herinneringen (`/remindme`)", description: "Vraag de bot om je ergens aan te herinneren.", completed: false },
    { id: 11, title: "Geavanceerde Terugkerende Taken", description: "Complexe patronen (bv. 'elke 3e donderdag van de maand').", completed: false },
  ],
  "Geavanceerd Project- & Resource Management": [
     { id: 14, title: "Task Review & Approval Workflow", description: "Een formele goedkeuringsstap voor voltooide taken.", completed: true },
     { id: 16, title: "Effort Estimation (Story Points)", description: "Schat de complexiteit in plaats van de tijd.", completed: true },
     { id: 13, title: "Gantt Chart View (Webdashboard)", description: "Visuele tijdlijn-weergave van projecten.", completed: false },
     { id: 15, title: "Actieve Tijdregistratie", description: "`/task timer start/stop` voor precieze tijdsmeting.", completed: false },
     { id: 17, title: "Workload Capacity Planning", description: "Visualiseer de werkdruk per teamlid.", completed: false },
     { id: 18, title: "Skills & Competency Matrix", description: "Tag gebruikers met vaardigheden voor betere taaktoewijzing.", completed: false },
  ],
  "Artificiële Intelligentie & Smart-Functionaliteit": [
    { id: 22, title: "AI Smart Assignment", description: "Stelt de beste persoon voor een taak voor op basis van data.", completed: true },
    { id: 24, title: "AI-Assisted Task Breakdown", description: "Genereert subtaken voor een complexe hoofdtaak.", completed: true },
    { id: 25, title: "AI-Powered Task Summarization", description: "Vat lange discussies in taak-comments samen.", completed: true },
    { id: 27, title: "Natural Language Processing (NLP) voor Taakcreatie", description: "Creëer taken met gewone zinnen.", completed: true },
    { id: 28, title: "Smart Search (Natural Language Query)", description: "Doorzoek de database met complexe vragen.", completed: true },
    { id: 23, title: "AI Predictive Analysis & Risk Detection", description: "Waarschuwt proactief voor projectvertragingen.", completed: false },
    { id: 26, title: "AI-Generated Reports", description: "Maak rapporten op basis van een prompt in natuurlijke taal.", completed: false },
  ],
  "Community & Gamification": [
    { id: 30, title: "Beloningssysteem", description: "Experience Points (EXP) en Punten.", completed: true },
    { id: 31, title: "Achievements & Badges", description: "Ontgrendelbare prestaties.", completed: true },
    { id: 32, title: "Leaderboards", description: "Wekelijks/maandelijks, per guild en per team.", completed: true },
    { id: 33, title: "Karma- & Bedanksysteem", description: "Stimuleer positieve interactie met `/thank`.", completed: false },
    { id: 35, title: "'Help Wanted' Board", description: "Vraag om hulp bij specifieke taken.", completed: false },
  ],
  "Het Webdashboard & Gebruikersinterface": [
      { id: 50, title: "Geavanceerd Webdashboard", description: "Het centrale beheerplatform.", completed: true },
      { id: 51, title: "Aanpasbare Dashboard Widgets", description: "Stel je eigen dashboard samen.", completed: true },
      { id: 75, title: "Gebruikersprofielen", description: "Bekijk de statistieken en taken van een gebruiker.", completed: true },
      { id: 49, title: "Publiek Kanban-bord (in Discord)", description: "Een kanaal als live Kanban-bord.", completed: false },
      { id: 52, title: "Keyboard Shortcuts (Webdashboard)", description: "Voor de power-users.", completed: false },
      { id: 54, title: "Offline Modus (PWA)", description: "Werk offline en synchroniseer later.", completed: false },
      { id: 55, title: "Dedicated Mobile Companion App", description: "Een native mobiele app voor iOS en Android.", completed: false },
  ],
  "Integraties & API": [
    { id: 57, title: "Google Calendar Integratie", description: "Synchroniseer deadlines met je agenda.", completed: false },
    { id: 58, title: "GitHub Integratie", description: "Koppel taken aan issues en pull requests.", completed: false },
    { id: 61, title: "Exposed REST API voor Ontwikkelaars", description: "Laat derden bouwen op Chorey.", completed: false },
    { id: 71, title: "Data Import/Export", description: "Migreer van/naar CSV, Trello, etc.", completed: false },
  ],
  "Notificaties & Communicatie": [
      { id: 79, title: "Flexibel Notificatiesysteem", description: "Configureerbare kanalen, DM's, en gebruikersvoorkeuren.", completed: true },
      { id: 81, title: "Dagelijks Overzicht", description: "Configureerbaar kanaal voor dagelijkse taakupdates.", completed: false },
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
