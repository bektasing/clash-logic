"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSettings,
  MIN_BUILDERS,
  MAX_BUILDERS,
} from "@/lib/settings-context";

export default function AyarlarPage() {
  const { builderCount, setBuilderCount } = useSettings();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (!Number.isNaN(value)) {
      setBuilderCount(value);
    }
  }

  return (
    <AppShell townHallLevel={null} globalStats={null}>
      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ayarlar</h2>
            <p className="text-sm text-muted-foreground">
              Dashboard hesaplamalarını özelleştirin.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>İnşaatçı Sayısı</CardTitle>
              <CardDescription>
                Tahmini süre hesabında kullanılır. Toplam ham süre bu sayıya
                bölünür.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={MIN_BUILDERS}
                  max={MAX_BUILDERS}
                  value={builderCount}
                  onChange={handleChange}
                  className="w-24"
                />
                <input
                  type="range"
                  min={MIN_BUILDERS}
                  max={MAX_BUILDERS}
                  value={builderCount}
                  onChange={handleChange}
                  className="flex-1 accent-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {MIN_BUILDERS}–{MAX_BUILDERS} arası. Varsayılan: 5
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
