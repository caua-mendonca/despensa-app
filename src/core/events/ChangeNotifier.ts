/** `local`: escrita feita no aparelho. `remote`: dados recebidos na sincronização. */
export type ChangeSource = 'local' | 'remote';

type Listener = (source: ChangeSource) => void;

/**
 * Observer simples que avisa quando os dados locais mudam, para que as telas
 * se atualizem e a sincronização automática seja agendada.
 */
export class ChangeNotifier {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(source: ChangeSource): void {
    this.listeners.forEach((listener) => listener(source));
  }
}
