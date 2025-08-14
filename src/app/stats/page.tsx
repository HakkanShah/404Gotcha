import { getVisits } from "@/lib/visits";
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
import { columns } from "./columns";
import LogoutButton from "./logout-button";

export default async function StatsPage() {
  const visits = await getVisits();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">404Gotcha</h1>
            <p className="text-muted-foreground">Visit Analytics Dashboard</p>
          </div>
          <LogoutButton />
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Visit Logs</CardTitle>
            <CardDescription>
              Here are the latest visits tracked by your link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of recent visits.</TableCaption>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.id} className={col.className}>
                      <div className="flex items-center gap-2">
                        {col.icon}
                        {col.header}
                      </div>
                    </TableHead>
                  ))}
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
                        {`${visit.city || '?'}, ${visit.country || '?'}`}
                      </TableCell>
                      <TableCell>
                        {`${visit.device} (${visit.os}, ${visit.browser})`}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a
                          href={visit.referrer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {visit.referrer}
                        </a>
                      </TableCell>
                      <TableCell>
                        {visit.isBot ? (
                          <Badge variant="destructive" title={visit.botReason}>Bot</Badge>
                        ) : (
                          <Badge variant="secondary">Human</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center h-24">
                      No visits yet. Share your link to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
