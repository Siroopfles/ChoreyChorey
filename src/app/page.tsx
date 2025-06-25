import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainCircuit, Bot, Gamepad2, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import LandingHeader from '@/components/landing/header'
import LandingFooter from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Transformeer je To-Do Lijst met AI
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Chorey is het intelligente taakbeheersysteem dat je helpt taken te prioriteren, subtaken te genereren en de perfecte persoon voor de klus te vinden, allemaal aangedreven door AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Gratis aan de slag</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/dashboard">Ga naar Dashboard</Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero"
                data-ai-hint="abstract geometric shapes"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Belangrijkste Kenmerken</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Sneller, Slimmer, Beter Georganiseerd</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Ontdek hoe de AI-gestuurde functies van Chorey je productiviteit naar een hoger niveau tillen.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 flex items-center justify-center">
                    <BrainCircuit className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI Taak Analyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Typ een commando in natuurlijke taal en Chorey zet het om in een gestructureerde taak met prioriteiten en deadlines.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Slimme Suggesties</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Ontvang AI-gegenereerde suggesties voor subtaken, story points en de beste persoon voor de taak op basis van prestaties uit het verleden.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                   <div className="rounded-full bg-primary/10 p-3 flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Gamified Punten Systeem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Verdien punten voor het voltooien van taken en beklim het scorebord. Maak huishoudelijke klusjes leuk en competitief!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
