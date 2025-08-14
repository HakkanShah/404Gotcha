'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";

const formSchema = z.object({
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, undefined);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: state.error,
      });
    }
  }, [state, toast]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    formAction(values.password);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeyRound className="text-primary" />
            Protected Area
          </CardTitle>
          <CardDescription>
            Enter the password to view the stats dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Unlock Stats
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
