"use client";

import { useCallback, useState } from "react";
import { ClipboardPaste, Pencil, Info } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { UpgradeJourney } from "@/components/dashboard/upgrade-journey";
import { GlobalProgress } from "@/components/dashboard/global-progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  parseClashData,
  ParseError,
  type ParseResult,
} from "@/lib/parser";
import { calculateGlobalStats } from "@/lib/calculator";
import { useSettings } from "@/lib/settings-context";

export default function HomePage() {
  const { builderCount: savedBuilderCount } = useSettings();
  const [jsonInput, setJsonInput] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [hasParsed, setHasParsed] = useState(false);

  const processJson = useCallback((input: string) => {
    if (!input.trim()) {
      toast({
        variant: "destructive",
        title: "Veri Bulunamadı",
        description: "Panoda geçerli bir JSON verisi yok.",
      });
      return;
    }

    try {
      const parsed = parseClashData(input);
      setResult(parsed);
      setHasParsed(true);
    } catch (error) {
      setResult(null);
      setHasParsed(true);

      if (error instanceof ParseError) {
        const titles: Record<typeof error.code, string> = {
          INVALID_JSON: "Hatalı Format",
          NO_DATA: "Veri Bulunamadı",
        };

        toast({
          variant: "destructive",
          title: titles[error.code],
          description: error.message,
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "Beklenmeyen Hata",
        description: "Veri işlenirken bir sorun oluştu.",
      });
    }
  }, []);

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      processJson(text);
    } catch {
      toast({
        variant: "destructive",
        title: "Panoya Erişilemedi",
        description: "Tarayıcı pano izni verilmedi veya pano boş.",
      });
    }
  }

  function handleManualAnalyze() {
    processJson(jsonInput);
  }

  const showEmptyState =
    hasParsed && (!result || result.groups.length === 0);

  // Calculate global stats
  const globalStats = result
    ? calculateGlobalStats(result.groups, savedBuilderCount)
    : null;

  const header = (
    <>
      <header className="flex items-center justify-end gap-2 border-b border-border bg-card/50 px-4 py-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEditor((v) => !v)}
          title="Veri Düzenle"
          className="size-9 text-muted-foreground"
        >
          <Pencil className="size-4" />
        </Button>
        <Button size="sm" onClick={handlePasteFromClipboard}>
          <ClipboardPaste className="size-4" />
          Panodan Yapıştır
        </Button>
      </header>

      {showEditor && (
        <div className="border-b border-border bg-card/30 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            <Textarea
              placeholder='[{"data": 1000001, "lvl": 12}, {"data": 1000009, "cnt": 4, "lvl": 10}, ...]'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[100px] font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualAnalyze}
              className="self-end"
            >
              Uygula
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <AppShell header={header} townHallLevel={result?.townHallLevel ?? null} globalStats={globalStats}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-3xl space-y-6">
          {!hasParsed && (
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-primary">
                Clash Logic
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Köy verinizi kopyalayın ve{" "}
                <span className="text-foreground">Panodan Yapıştır</span>{" "}
                butonuna basın.
              </p>
            </div>
          )}

          {result && result.groups.length > 0 && globalStats && (
            <>
              <GlobalProgress globalStats={globalStats} />
              <UpgradeJourney groups={result.groups} />
            </>
          )}

          {showEmptyState && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-6 py-10 text-center">
              <Info className="size-8 text-primary/60" />
              <p className="text-sm text-muted-foreground">
                Sadece Top ve Okçu Kulesi verileri gösteriliyor.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Panodaki veride bu binalar bulunamadı.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
