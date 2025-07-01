
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <SearchX className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-2 text-2xl font-semibold">Pagina Niet Gevonden</h2>
      <p className="mt-4 max-w-sm text-muted-foreground">
        Oeps! De pagina die je zoekt bestaat niet, is verplaatst, of is tijdelijk onbeschikbaar.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Terug naar Dashboard</Link>
      </Button>
    </div>
  );
}
