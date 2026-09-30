const TAMANHO_PAGINA = 1000;

/**
 * O Supabase devolve no máximo 1000 linhas por consulta e corta o resto sem avisar. Esta função
 * busca página a página até acabar. `consulta` recebe o intervalo (de/até, inclusivo) e deve
 * aplicar `.range(de, ate)` com uma ordenação estável.
 */
export async function selecionarTodas<T>(
  consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const todas: T[] = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await consulta(de, de + TAMANHO_PAGINA - 1);
    if (error) throw new Error(error.message);
    todas.push(...(data ?? []));
    if (!data || data.length < TAMANHO_PAGINA) return todas;
  }
}
