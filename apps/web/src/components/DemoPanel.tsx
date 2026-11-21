import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { isMock } from "@/services";
import { mockControl, type MockMode } from "@/services/mockApi";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/misc";

/** Painel de demonstração: só aparece com o back-end simulado. */
export function DemoPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<MockMode>(mockControl.getMode());
  if (!isMock) return null;

  const change = (next: MockMode) => {
    setMode(next);
    mockControl.setMode(next);
  };

  return (
    <div className="fixed bottom-20 left-4 z-40 md:bottom-6 md:left-6">
      {open ? (
        <div className="grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-xl border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Modo demonstração</p>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar painel">
              <X />
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Simula como as listas e o mapa se comportam. Os dados ficam no navegador.
          </p>
          <Segmented<MockMode>
            ariaLabel="Estado das telas"
            value={mode}
            onChange={change}
            className="flex-wrap"
            options={[
              { value: "normal", label: "Normal" },
              { value: "loading", label: "Carregando" },
              { value: "error", label: "Erro" },
              { value: "empty", label: "Vazio" },
            ]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              mockControl.reset();
              setMode("normal");
            }}
          >
            Restaurar dados
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="shadow-md">
          <SlidersHorizontal /> Demo
        </Button>
      )}
    </div>
  );
}
