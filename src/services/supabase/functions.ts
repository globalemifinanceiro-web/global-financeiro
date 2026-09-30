import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Invoca uma Edge Function e extrai a mensagem de erro real do corpo da resposta — o
 * supabase-js, por padrão, só devolve "Edge Function returned a non-2xx status code" em
 * error.message quando a função responde com status de erro, escondendo o { error: "..." }
 * que as nossas funções sempre devolvem.
 */
export async function invocarFuncao<T>(nome: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nome, body ? { body } : undefined);

  if (error) {
    let mensagem = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const corpo = await error.context.json();
        if (corpo?.error) mensagem = corpo.error;
      } catch {
        // corpo não era JSON — fica a mensagem padrão
      }
    }
    throw new Error(mensagem);
  }

  if (data?.error) throw new Error(data.error);
  return data as T;
}
