import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LandingFooter from "@/components/landing/footer"
import LandingHeader from "@/components/landing/header"

const roadmapData = {
  q3_2024: [
    { title: "Mobiele App Lancering", description: "Een native mobiele app voor iOS en Android." },
    { title: "Geavanceerde Notificaties", description: "Aanpasbare notificatie-instellingen en kanalen." },
    { title: "Integratie met Kalenders", description: "Synchroniseer Chorey-taken met Google Calendar en Outlook." },
  ],
  q4_2024: [
    { title: "Herhalende Taken", description: "Stel taken in die dagelijks, wekelijks of maandelijks herhaald worden." },
    { title: "Thema Aanpassing", description: "Meer kleurenthema's en aanpassingsopties." },
    { title: "AI-gestuurde Planning", description: "Laat AI een wekelijkse planning voor je genereren." },
  ],
  future: [
    { title: "Boodschappenlijst Integratie", description: "Genereer en beheer boodschappenlijsten op basis van taken." },
    { title: "Budgettering Tools", description: "Houd uitgaven voor huishoudelijke taken bij." },
    { title: "Openbare API", description: "Integreer Chorey met je favoriete apps en diensten." },
  ],
}

export default function RoadmapPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Chorey Roadmap</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Een blik op de toekomst van Chorey. We werken constant aan het verbeteren van ons platform.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 py-12 lg:grid-cols-3">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Q3 2024</h3>
                <div className="space-y-4">
                  {roadmapData.q3_2024.map((item) => (
                    <Card key={item.title}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Q4 2024</h3>
                <div className="space-y-4">
                  {roadmapData.q4_2024.map((item) => (
                    <Card key={item.title}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Toekomst</h3>
                <div className="space-y-4">
                  {roadmapData.future.map((item) => (
                    <Card key={item.title}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
