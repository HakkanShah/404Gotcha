
import { getVisits, clearVisits } from "@/lib/visits";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, Users, Bot, Target, Calendar, Hash, MapPin, Laptop, Link as LinkIcon, Trash2 } from "lucide-react";
import StatsSummary from "./stats-summary";
import LogoutButton from "./logout-button";
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
} from "@/components/ui/alert-dialog"

export const dynamic = 'force-dynamic';

async function ClearHistoryButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all
            your visit data from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={clearVisits}>
            <AlertDialogAction type="submit">Continue</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export default async function StatsPage() {
  const visits = await getVisits();

  const totalVisits = visits.length;
  const humanVisits = visits.filter((v) => !v.isBot).length;
  const botVisits = totalVisits - humanVisits;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">404Gotcha</h1>
            <p className="text-muted-foreground">Visit Analytics Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/setup">
                <Settings className="mr-2 h-4 w-4" />
                Setup
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsSummary icon={<Target />} title="Total Visits" value={totalVisits} />
          <StatsSummary icon={<Users />} title="Human Visits" value={humanVisits} />
          <StatsSummary icon={<Bot />} title="Bot Visits" value={botVisits} />
        </section>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Visit Logs</CardTitle>
              <CardDescription>
                Here are the latest visits tracked by your link.
              </CardDescription>
            </div>
            <ClearHistoryButton />
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableCaption>A list of recent visits.</TableCaption>
                <TableHeader>
                  <TableRow>
                      <TableHead className="w-[200px]">Timestamp</TableHead>
                      <TableHead className="w-[150px]">IP Address</TableHead>
                      <TableHead className="w-[180px]">Location</TableHead>
                      <TableHead className="w-[250px]">Device Info</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.length > 0 ? (
                    visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>
                          {new Date(visit.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{visit.ip}</TableCell>
                        <TableCell>
                          {`${visit.city || "?"}, ${visit.country || "?"}`}
                        </TableCell>
                        <TableCell>
                          {`${visit.device} (${visit.os}, ${visit.browser})`}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <a
                            href={visit.referrer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            title={visit.referrer}
                          >
                            {visit.referrer}
                          </a>
                        </TableCell>
                        <TableCell>
                          {visit.isBot ? (
                            <Badge variant="destructive" title={visit.botReason}>
                              Bot
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Human</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24"
                      >
                         <div className="flex flex-col items-center gap-2">
                          <p>No visits yet. Share your link to get started!</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <Card key={visit.id} className="w-full">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                         <div className="text-sm text-muted-foreground flex items-center">
                           <Calendar size={14} className="mr-2" />
                           {new Date(visit.timestamp).toLocaleString()}
                          </div>
                           {visit.isBot ? (
                            <Badge variant="destructive" title={visit.botReason}>
                              Bot
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Human</Badge>
                          )}
                      </div>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center text-sm">
                          <Hash size={14} className="mr-2 text-muted-foreground" />
                          <span className="font-mono">{visit.ip}</span>
                        </div>
                        <div className="flex items-center text-sm">
                           <MapPin size={14} className="mr-2 text-muted-foreground" />
                           {`${visit.city || "?"}, ${visit.country || "?"}`}
                        </div>
                        <div className="flex items-center text-sm">
                          <Laptop size={14} className="mr-2 text-muted-foreground" />
                           {`${visit.device} (${visit.os}, ${visit.browser})`}
                        </div>
                         <div className="flex items-start text-sm">
                           <LinkIcon size={14} className="mr-2 mt-1 text-muted-foreground" />
                           <a href={visit.referrer} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">
                              {visit.referrer}
                           </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
               ) : (
                  <div className="text-center h-24 flex flex-col items-center justify-center gap-2">
                    <p>No visits yet!</p>
                  </div>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
