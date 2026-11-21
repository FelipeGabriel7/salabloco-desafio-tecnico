import { Moon, Sun } from "lucide-react";
import { Segmented } from "@/components/ui/misc";
import { useTheme, type Theme } from "@/contexts/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Segmented<Theme>
      ariaLabel="Tema"
      value={theme}
      onChange={setTheme}
      options={[
        { value: "light", label: <Sun className="size-4" aria-hidden="true" />, ariaLabel: "Tema claro" },
        { value: "dark", label: <Moon className="size-4" aria-hidden="true" />, ariaLabel: "Tema escuro" },
      ]}
    />
  );
}
