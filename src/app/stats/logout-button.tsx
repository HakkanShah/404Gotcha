'use client';

import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/actions';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="outline" type="submit">
        <LogOut className="mr-2 h-4 w-4" />
        Log Out
      </Button>
    </form>
  );
}
