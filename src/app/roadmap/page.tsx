import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LandingFooter from "@/components/landing/footer"
import LandingHeader from "@/components/landing/header"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { roadmapData } from "@/lib/roadmap-data"


export default function RoadmapPage() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
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
            <div className="mx-auto grid max-w-7xl gap-12 py-12">
              {Object.entries(roadmapData).map(([category, features]) => (
                <div key={category} className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight">{category}</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.sort((a, b) => a.id - b.id).map((item) => (
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
