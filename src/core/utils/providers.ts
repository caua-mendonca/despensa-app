/**
 * Abstrações de efeitos colaterais (tempo e geração de IDs). Os casos de uso
 * dependem destas interfaces, o que os torna determinísticos nos testes.
 */
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  generate(): string;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
