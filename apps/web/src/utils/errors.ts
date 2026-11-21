import { ApiError } from "@/services";

/** Traduz um erro da API em título e mensagem para a tela. */
export function describeError(err: unknown): { title: string; message: string } {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "NETWORK":
        return { title: "Não foi possível carregar", message: "O servidor não respondeu. Verifique sua conexão e tente de novo." };
      case "FORBIDDEN":
        return { title: "Sem acesso", message: "Você não tem acesso a esta empresa." };
      case "NOT_FOUND":
        return { title: "Não encontrado", message: err.message };
      default:
        return { title: "Algo deu errado", message: err.message };
    }
  }
  return { title: "Algo deu errado", message: "Erro inesperado. Tente novamente." };
}
