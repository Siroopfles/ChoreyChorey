'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // TODO: Log the error to an error reporting service like Sentry or LogRocket
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
        <Card className="w-full max-w-xl shadow-2xl">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <CardTitle>Er is een onverwachte fout opgetreden</CardTitle>
                    <CardDescription>
                        Onze excuses voor het ongemak. U kunt proberen de actie opnieuw uit te voeren of terugkeren naar het dashboard.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Technische Details</AccordionTrigger>
                        <AccordionContent>
                            <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground font-mono overflow-auto">
                                <p className="font-semibold">Foutmelding:</p>
                                <p>{error.message}</p>
                                {error.digest && (
                                    <>
                                        <p className="font-semibold mt-2">Digest:</p>
                                        <p>{error.digest}</p>
                                    </>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => reset()} className="w-full sm:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4"/>
                    Probeer opnieuw
                </Button>
                 <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/dashboard">Terug naar Dashboard</Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  )
}
