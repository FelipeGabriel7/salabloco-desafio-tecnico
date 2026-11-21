import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_EVENT } from "@/services/mockApi";

type State<T> = { status: "loading"; data?: T } | { status: "ready"; data: T } | { status: "error"; error: unknown };

/**
 * Carrega dados e expõe carregando, erro e pronto. Recarrega quando as dependências mudam,
 * quando `reload()` é chamado ou quando o painel de demo troca o estado do mock.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ status: "loading", data: s.status === "ready" ? s.data : undefined }));
    fnRef
      .current()
      .then((data) => !cancelled && setState({ status: "ready", data }))
      .catch((error: unknown) => !cancelled && setState({ status: "error", error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(MOCK_EVENT, onChange);
    return () => window.removeEventListener(MOCK_EVENT, onChange);
  }, []);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { state, reload };
}
