import { useEffect, useState } from "react";

type State<T> = { status: "loading"; data?: T } | { status: "ready"; data: T } | { status: "error"; error: unknown };

export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    load().then((data) => {
      if (active) setState({ status: "ready", data });
    })
      .catch((error: unknown) => {
        if (active) setState({ status: "error", error });
      });

    return () => {
      active = false;
    };
  }, [...deps, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  return { state, reload };
}
