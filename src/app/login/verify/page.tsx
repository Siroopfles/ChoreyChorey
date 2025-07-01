
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Loader2, ShieldCheck, Mountain } from 'lucide-react';
import { verifyLoginCode } from '@/app/actions/user/two-factor.actions';

const verifySchema = z.object({
  code: z.string().min(6, 'Code moet minimaal 6 tekens lang zijn.'),
});
type VerifyFormValues = z.infer<typeof verifySchema>;

export default function VerifyLoginPage() {
  const { authUser, loading, completeMfa, logout } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !authUser) {
      router.push('/login');
    }
  }, [authUser, loading, router]);

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (data: VerifyFormValues) => {
    if (!authUser) return;
    setIsSubmitting(true);
    setError('');

    const { data: result, error: actionError } = await verifyLoginCode(authUser.uid, data.code);
    
    if (result?.success) {
      await completeMfa();
    } else {
      setError(actionError || 'Er is een onbekende fout opgetreden.');
      form.reset();
    }

    setIsSubmitting(false);
  };

  if (loading || !authUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Link href="/" aria-label="Home">
            <Mountain className="h-8 w-8 text-primary"/>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
             <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verificatie vereist</CardTitle>
            <CardDescription>
              Voer de 6-cijferige code van uw authenticator-app of een herstelcode in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verificatiecode</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          {...field} 
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          pattern="\d{6,}"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verifiëren
                </Button>
                 <Button type="button" variant="link" className="w-full" onClick={logout}>
                    Annuleren en uitloggen
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
