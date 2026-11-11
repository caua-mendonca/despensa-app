# ValidaJá — controle de despensa e validade de alimentos

Aplicativo mobile em **React Native + Expo** que ajuda famílias a **reduzir o desperdício de alimentos**. O usuário cadastra os itens que tem em casa (armário, geladeira e freezer), e o app mostra o que já **venceu** e o que está **vencendo** nos próximos dias.

Os dados são salvos primeiro no aparelho (**Expo SQLite**), então o app funciona sem internet. Quando há conexão, eles são sincronizados com a nuvem (**Supabase / PostgreSQL**).

## 1. O problema

- Uma parte grande dos alimentos comprados pelas famílias brasileiras acaba no lixo. Um dos motivos mais comuns é **esquecer o que tem em casa e quando vence**.
- Hoje a validade só fica na embalagem, e ninguém confere item por item.
- O ValidaJá junta essas informações num só lugar e destaca o que precisa ser consumido primeiro.
- **2º bimestre (visão computacional):** a data de validade e o nome do produto serão lidos com a câmera. Esse ponto de extensão já existe: basta um novo caso de uso que preencha o `PantryItemDraft`.

## 2. Funcionalidades

| Tela | O que faz |
| --- | --- |
| Login / Cadastro | Autenticação por e-mail e senha (Supabase Auth). |
| Início | Contadores de itens **vencidos / vencendo (≤ 3 dias) / em dia** e a lista "Precisa de atenção". |
| Meus itens | Lista ordenada pela validade, com busca e filtros por status, local e categoria. |
| Novo / Editar item | Formulário validado: nome, validade, quantidade, unidade, local, categoria e observações. |
| Ajustes | Status da sincronização, pendências, botão "Sincronizar agora" e logout. |
| Banco local (SQLite) | Mostra o caminho do arquivo `.db`, a consulta SQL executada e as linhas da tabela `pantry_items` com o `sync_status` de cada uma (usada na demonstração). |
| Nuvem (Supabase) | Consulta a tabela `pantry_items` direto no PostgreSQL do Supabase, para comparar com o banco local lado a lado (usada na demonstração). |

O indicador no topo das telas mostra o estado da sincronização (sincronizado, pendente, offline ou erro). Tocar nele dispara uma sincronização.

## 3. Tecnologias

- **Expo SDK 57**, React Native 0.86, TypeScript (strict)
- **Expo Router** (navegação por arquivos, abas e rotas protegidas com `Stack.Protected`)
- **expo-sqlite**: banco local, com migrations versionadas via `PRAGMA user_version`
- **@supabase/supabase-js**: Auth e PostgreSQL (sessão persistida com `expo-sqlite/localStorage`)
- **zod** (validação), **zustand** (estado global de sessão e sync), **NetInfo** (conectividade)
- **Jest** (`jest-expo`) para os testes unitários

## 4. Arquitetura

**Clean Architecture + MVVM, organizada por feature.**

```
src/
├── app/                      # Rotas (Expo Router), só "casca" das telas
│   ├── _layout.tsx           # SQLiteProvider + container de DI + guarda de autenticação
│   ├── (auth)/               # login, register
│   └── (app)/                # área logada: (tabs)/index, items, settings; items/new, items/[id]; debug/local-db
├── core/                     # Infraestrutura transversal
│   ├── di/                   # Composition root (container.ts) + ContainerProvider
│   ├── errors/               # AppError + Result<T> (erros tipados, sem throw na UI)
│   ├── events/               # ChangeNotifier (Observer: dados locais mudaram)
│   ├── theme/ utils/ config/
├── infra/                    # Adaptadores externos
│   ├── database/             # migrations do SQLite
│   ├── supabase/             # cliente + tipos do schema
│   └── network/              # NetworkMonitor (NetInfo)
├── features/
│   ├── auth/                 # domain (User, AuthRepository, casos de uso) · data (Supabase) · presentation
│   ├── pantry/               # domain (entidade, regras de validade, casos de uso) · data (SQLite/Supabase) · presentation
│   └── sync/                 # domain (SyncService) · data (SyncServiceImpl) · presentation (status, ajustes)
└── shared/                   # Componentes de UI reutilizáveis e hooks genéricos
```

```
Tela (View) → ViewModel (hook) → Caso de uso → Repositório (interface)
                                                    │
                                   PantryRepositoryImpl → SQLite  (fonte da verdade)
                                                    │
                                   SyncService ──push/pull──→ Supabase (PostgreSQL)
```

Regras seguidas:
- O **domínio** (entidades, regras de validade, casos de uso) não conhece React, SQLite nem Supabase. Por isso é testado com um repositório em memória.
- As **telas** só usam os ViewModels, e os ViewModels só chamam os casos de uso.
- As **dependências** são criadas num único lugar (`src/core/di/container.ts`) e injetadas via Context. Assim fica fácil trocar uma implementação ou usar fakes nos testes.

### Sincronização offline-first

1. Toda escrita vai para o SQLite com `sync_status = 'pending'`. A exclusão é **lógica** (`deleted_at`), para que a remoção também seja sincronizada.
2. **Push:** as linhas pendentes são enviadas com `upsert` ao Supabase e marcadas como `synced`, mas só se não mudaram durante o envio.
3. **Pull:** o app baixa o que mudou desde o último cursor (`updated_at` definido pelo **servidor**). A versão do servidor substitui as linhas locais já sincronizadas; linhas ainda `pending` são preservadas e enviadas no próximo push. Como só o relógio do servidor é usado, um celular com horário errado não atrapalha.
4. **Quando a sincronização acontece:** ao abrir o app ou fazer login, quando a internet volta, quando o app volta ao primeiro plano, 1,5 s após uma alteração local, no pull-to-refresh e pelo botão "Sincronizar agora".
5. Um lock impede que duas sincronizações rodem ao mesmo tempo.

## Visão Computacional (2º bimestre): leitura de código de barras / QR Code

- **Tecnologia:** `expo-camera` (`CameraView` + `onBarcodeScanned`), tipos EAN-13/8, UPC, Code128/39 e QR.
- **Fluxo:** Escanear produto → `LookupProductByBarcodeUseCase` → (1) se o código já existe no SQLite, abre o item para edição; (2) senão consulta o Open Food Facts e pré-preenche nome e categoria; (3) offline, preenche só o código. O usuário informa a validade e salva.
- **SQLite:** coluna `barcode` (migração v2 em `src/infra/database/migrations.ts`), com índice; buscas por `PantryLocalDataSource.findByBarcode`.
- **Supabase:** rode `supabase/migrations/002_add_barcode.sql` no SQL Editor. O código sobe pela sincronização existente.
- **Demo:** Início → Escanear produto → cadastrar → Ajustes → Banco local (coluna `barcode`) → Sincronizar → Nuvem (Supabase).

## 5. Como rodar

### 5.1 Criar o backend no Supabase
1. Crie um projeto gratuito em <https://supabase.com>.
2. Abra **SQL Editor → New query**, cole o conteúdo de [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) e clique em **Run**. Isso cria a tabela, os índices, o trigger e o RLS.
3. **Para facilitar a demonstração:** em **Authentication → Sign In / Providers → Email**, desative **Confirm email**. Assim o cadastro já entra direto no app.
4. Em **Project Settings → API Keys**, copie a *Project URL* e a *Publishable key*.

### 5.2 Configurar e iniciar o app
```bash
npm install
cp .env.example .env        # preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx expo start -c
```
Depois, leia o QR Code com o app **Expo Go** (Android/iOS) ou pressione `a` para abrir no emulador Android.

### 5.3 Qualidade
```bash
npm test            # testes unitários (domínio + sincronização)
npm run typecheck   # TypeScript
npm run lint        # ESLint
npx expo-doctor     # saúde do projeto Expo
```

## 6. Roteiro da apresentação (≈ 10 min)

| Tempo | Etapa | O que mostrar |
| --- | --- | --- |
| 0:00–1:30 | **Problema** | O desperdício de alimentos em casa e a proposta do ValidaJá. |
| 1:30–4:00 | **App funcionando** | Cadastro/login, criar 3 itens (um vencido, um vencendo e um em dia), Dashboard, filtros da lista, edição. |
| 4:00–6:30 | **Expo SQLite** | Ativar o **modo avião** e criar um item. Ele aparece normalmente, e o indicador mostra "1 pendente(s)". Em *Ajustes → Ver banco local (SQLite)*, a linha aparece com `sync_status = pending`. |
| 6:30–9:00 | **Supabase** | Desativar o modo avião. A sincronização é automática e a linha passa para `synced`. No **Table Editor** do Supabase, mostrar o registro. Editar um campo por lá, puxar a lista para baixo no app e ver a mudança chegar. Excluir um item e mostrar o `deleted_at` no Supabase. |
| 9:00–10:00 | **Arquitetura e próximos passos** | Camadas, RLS (cada usuário só vê os próprios dados) e a leitura de validade pela câmera no 2º bimestre. |
