import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsSummaryProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
}

export default function StatsSummary({ icon, title, value }: StatsSummaryProps) {
    return (
        <Card className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
