
'use client';

import { useActionState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { clearVisitsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function ClearVisitsButton() {
  const [state, formAction, isPending] = useActionState(clearVisitsAction, undefined);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
    if (state?.success) {
      toast({
        title: 'Success',
        description: 'All visit history has been cleared.',
      });
    }
  }, [state, toast]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all visit history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
                 <Button type="submit" variant="destructive" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 />}
                    Delete All
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
