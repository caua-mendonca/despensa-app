import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { ChangeNotifier } from '@/core/events/ChangeNotifier';
import { systemClock, type IdGenerator } from '@/core/utils/providers';
import { SupabaseAuthRepository } from '@/features/auth/data/SupabaseAuthRepository';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository';
import { SignInUseCase } from '@/features/auth/domain/usecases/SignInUseCase';
import { SignOutUseCase } from '@/features/auth/domain/usecases/SignOutUseCase';
import { SignUpUseCase } from '@/features/auth/domain/usecases/SignUpUseCase';
import { PantryLocalDataSource } from '@/features/pantry/data/datasources/PantryLocalDataSource';
import { PantryRemoteDataSource } from '@/features/pantry/data/datasources/PantryRemoteDataSource';
import { PantryRepositoryImpl } from '@/features/pantry/data/repositories/PantryRepositoryImpl';
import { CreatePantryItemUseCase } from '@/features/pantry/domain/usecases/CreatePantryItemUseCase';
import { DeletePantryItemUseCase } from '@/features/pantry/domain/usecases/DeletePantryItemUseCase';
import { GetDashboardSummaryUseCase } from '@/features/pantry/domain/usecases/GetDashboardSummaryUseCase';
import { GetPantryItemUseCase } from '@/features/pantry/domain/usecases/GetPantryItemUseCase';
import { ListPantryItemsUseCase } from '@/features/pantry/domain/usecases/ListPantryItemsUseCase';
import { LookupProductByBarcodeUseCase } from '@/features/pantry/domain/usecases/LookupProductByBarcodeUseCase';
import { openFoodFactsLookup } from '@/infra/catalog/openFoodFacts';
import { UpdatePantryItemUseCase } from '@/features/pantry/domain/usecases/UpdatePantryItemUseCase';
import { SyncMetaLocalDataSource } from '@/features/sync/data/SyncMetaLocalDataSource';
import { SyncServiceImpl } from '@/features/sync/data/SyncServiceImpl';
import type { SyncService } from '@/features/sync/domain/SyncService';
import { NetInfoNetworkMonitor, type NetworkMonitor } from '@/infra/network/NetworkMonitor';
import { getSupabaseClient } from '@/infra/supabase/client';

const uuidGenerator: IdGenerator = { generate: () => Crypto.randomUUID() };

/**
 * Composition root: o único lugar que conhece as implementações concretas.
 * Telas e ViewModels recebem as dependências prontas via `useContainer()`.
 */
export function createContainer(db: SQLiteDatabase) {
  const supabase = getSupabaseClient();
  const localChanges = new ChangeNotifier();
  const network: NetworkMonitor = new NetInfoNetworkMonitor();

  const authRepository: AuthRepository = new SupabaseAuthRepository(supabase);

  const pantryLocal = new PantryLocalDataSource(db);
  const pantryRemote = new PantryRemoteDataSource(supabase);
  const pantryRepository = new PantryRepositoryImpl(pantryLocal, localChanges);

  const syncService: SyncService = new SyncServiceImpl(
    pantryLocal,
    pantryRemote,
    new SyncMetaLocalDataSource(db),
    network,
    localChanges,
    systemClock,
  );

  return {
    authRepository,
    syncService,
    network,
    localChanges,
    /** Expostos apenas para as telas de inspeção dos bancos (demonstração). */
    database: db,
    pantryLocalDataSource: pantryLocal,
    pantryRemoteDataSource: pantryRemote,
    useCases: {
      signIn: new SignInUseCase(authRepository),
      signUp: new SignUpUseCase(authRepository),
      signOut: new SignOutUseCase(authRepository),
      listPantryItems: new ListPantryItemsUseCase(pantryRepository, systemClock),
      getPantryItem: new GetPantryItemUseCase(pantryRepository),
      createPantryItem: new CreatePantryItemUseCase(pantryRepository, uuidGenerator, systemClock),
      updatePantryItem: new UpdatePantryItemUseCase(pantryRepository, systemClock),
      deletePantryItem: new DeletePantryItemUseCase(pantryRepository, systemClock),
      getDashboardSummary: new GetDashboardSummaryUseCase(pantryRepository, systemClock),
      lookupProductByBarcode: new LookupProductByBarcodeUseCase(pantryRepository, openFoodFactsLookup),
    },
  };
}

export type Container = ReturnType<typeof createContainer>;
