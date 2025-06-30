import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LandingFooter from "@/components/landing/footer"
import LandingHeader from "@/components/landing/header"
import { Check, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { roadmapPhases } from "@/lib/roadmap"


export default function RoadmapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Chorey Roadmap</h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Een overzicht van wat we hebben gebouwd en wat de toekomst brengt. We werken constant aan het verbeteren van ons platform.
              </p>
            </div>
            <div className="mx-auto grid max-w-7xl gap-16 py-12">
              {roadmapPhases.map((phase) => (
                <div key={phase.name} className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">{phase.name}</h2>
                    <p className="text-muted-foreground max-w-3xl">{phase.description}</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {phase.features.sort((a, b) => a.id - b.id).map((item) => (
                      <Card key={item.id} className={cn("flex flex-col", item.completed ? "bg-secondary/50 border-green-500/20" : "bg-card")}>
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                          <CardTitle className={cn("text-base", item.completed && "text-muted-foreground")}>{item.title}</CardTitle>
                          {item.completed && <Check className="h-6 w-6 text-green-500 shrink-0" />}
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className={cn("text-sm text-muted-foreground", item.completed && "text-muted-foreground/80")}>{item.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                   {phase.nativeFeatures && phase.nativeFeatures.length > 0 && (
                    <div className="space-y-4 pt-8">
                      <h3 className="text-2xl font-semibold flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-muted-foreground" />
                        Native Mobiele Features
                      </h3>
                       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {phase.nativeFeatures.sort((a, b) => a.id - b.id).map((item) => (
                          <Card key={item.id} className={cn("flex flex-col border-dashed", item.completed ? "bg-secondary/50 border-green-500/20" : "bg-card")}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                              <CardTitle className={cn("text-base", item.completed && "text-muted-foreground")}>{item.title}</CardTitle>
                              {item.completed && <Check className="h-6 w-6 text-green-500 shrink-0" />}
                            </CardHeader>
                            <CardContent className="flex-grow">
                              <p className={cn("text-sm text-muted-foreground", item.completed && "text-muted-foreground/80")}>{item.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

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
