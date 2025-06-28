'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
        <Card className="w-full max-w-lg text-center shadow-2xl">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="mt-4">Er is iets misgegaan</CardTitle>
                <CardDescription>
                    Oeps! Er is een onverwachte fout opgetreden. Ons team is op de hoogte gebracht.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => reset()}>
                    Probeer opnieuw
                </Button>
            </CardContent>
        </Card>
    </div>
  )
}
