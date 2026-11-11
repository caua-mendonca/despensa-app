import NetInfo from '@react-native-community/netinfo';

export interface NetworkMonitor {
  isOnline(): Promise<boolean>;
  /** Notifica mudanças de conectividade. Retorna a função de cancelamento. */
  subscribe(listener: (online: boolean) => void): () => void;
}

// `isInternetReachable` pode vir `null` enquanto o teste de alcance não termina.
const toOnline = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) =>
  Boolean(state.isConnected) && state.isInternetReachable !== false;

export class NetInfoNetworkMonitor implements NetworkMonitor {
  async isOnline(): Promise<boolean> {
    return toOnline(await NetInfo.fetch());
  }

  subscribe(listener: (online: boolean) => void): () => void {
    return NetInfo.addEventListener((state) => listener(toOnline(state)));
  }
}
