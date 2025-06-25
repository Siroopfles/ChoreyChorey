'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Mountain } from "lucide-react"

export default function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center" prefetch={false}>
        <Mountain className="h-6 w-6" />
        <span className="sr-only">Chorey</span>
      </Link>
      <nav className="ml-auto hidden gap-4 sm:gap-6 lg:flex">
        <Link href="/#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          Kenmerken
        </Link>
        <Link href="/roadmap" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          Roadmap
        </Link>
        <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
          Inloggen
        </Link>
        <Button asChild>
          <Link href="/signup">Registreren</Link>
        </Button>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden ml-auto">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold" prefetch={false}>
              <Mountain className="h-6 w-6" />
              <span className="sr-only">Chorey</span>
            </Link>
            <Link href="/#features" className="hover:text-foreground" prefetch={false}>
              Kenmerken
            </Link>
            <Link href="/roadmap" className="text-muted-foreground hover:text-foreground" prefetch={false}>
              Roadmap
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground" prefetch={false}>
              Inloggen
            </Link>
            <Button asChild>
              <Link href="/signup">Registreren</Link>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
