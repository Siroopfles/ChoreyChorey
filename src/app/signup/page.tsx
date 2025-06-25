'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Loader2, Mountain } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters lang zijn.'),
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters lang zijn.'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signupWithEmail, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
        name: '',
        email: '',
        password: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    await signupWithEmail(data.email, data.password, data.name);
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  }
  
  if (loading || (!loading && user)) {
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
                <CardHeader>
                <CardTitle className="text-2xl">Account Aanmaken</CardTitle>
                <CardDescription>Maak een nieuw account aan om Chorey te gebruiken.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Naam</FormLabel>
                            <FormControl>
                            <Input placeholder="Jan Janssen" {...field} autoComplete="name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mailadres</FormLabel>
                            <FormControl>
                            <Input type="email" placeholder="naam@voorbeeld.com" {...field} autoComplete="email" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Wachtwoord</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} autoComplete="new-password" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registreren
                    </Button>
                    </form>
                </Form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Of ga verder met</span>
                    </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 65.6l-58.3 52.7C338.6 97.2 297.9 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 406 248 406c45.3 0 82.2-22.4 102.3-43.2l-64.8-49.9h-98.2v-73.3h175.4c1.6 9.3 2.6 19.1 2.6 29.5z"></path></svg>
                    }
                    Google
                </Button>
                </CardContent>
                <CardFooter className="justify-center text-sm">
                <p>Al een account?&nbsp;</p>
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Log hier in
                </Link>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
