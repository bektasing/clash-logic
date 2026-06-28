import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateEstimatedSeconds,
  formatDurationFromSeconds,
} from "@/lib/time-calculator";

interface TimeSummaryProps {
  totalSeconds: number;
  builderCount: number;
}

export function TimeSummary({ totalSeconds, builderCount }: TimeSummaryProps) {
  const estimatedSeconds = calculateEstimatedSeconds(
    totalSeconds,
    builderCount
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Toplam Ham Süre
          </CardTitle>
          <Clock className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-primary sm:text-2xl">
            {formatDurationFromSeconds(totalSeconds)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tahmini Süre ({builderCount} İnşaatçı ile)
          </CardTitle>
          <Clock className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-primary sm:text-2xl">
            {formatDurationFromSeconds(estimatedSeconds)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
