# ValidaJá — controle de despensa e validade de alimentos

Aplicativo mobile em **React Native + Expo** que ajuda famílias a **reduzir o desperdício de alimentos**. O usuário cadastra os itens que tem em casa (armário, geladeira e freezer) e o app mostra o que já **venceu** e o que está **vencendo** nos próximos dias. Os itens podem ser cadastrados lendo o **código de barras / QR Code** do produto com a câmera.

Os dados são salvos primeiro no aparelho (**Expo SQLite**), então o app funciona **sem internet**. Quando há conexão, eles são sincronizados com a nuvem (**Supabase / PostgreSQL**).

## Sumário

1. [O problema](#1-o-problema)
2. [Funcionalidades](#2-funcionalidades)
3. [Tecnologias](#3-tecnologias)
4. [Arquitetura](#4-arquitetura)
5. [Fluxo do sistema](#5-fluxo-do-sistema)
6. [Modelo de dados](#6-modelo-de-dados)
7. [Sincronização offline-first](#7-sincronização-offline-first)
8. [Visão Computacional: código de barras / QR Code](#8-visão-computacional-código-de-barras--qr-code)
9. [Segurança](#9-segurança)
10. [Como rodar](#10-como-rodar)
11. [Qualidade e testes](#11-qualidade-e-testes)
12. [Roteiro da apresentação](#12-roteiro-da-apresentação-10-min)
13. [Licença](#13-licença)

---

## 1. O problema

- Uma parte grande dos alimentos comprados pelas famílias brasileiras acaba no lixo. Um dos motivos mais comuns é **esquecer o que tem em casa e quando vence**.
- Hoje a validade só fica na embalagem, e ninguém confere item por item.
- O ValidaJá junta essas informações num só lugar e destaca o que precisa ser consumido primeiro.
- Para agilizar o cadastro, o app usa **visão computacional**: a câmera lê o código de barras do produto e o nome e a categoria são preenchidos automaticamente.

## 2. Funcionalidades

| Tela | O que faz |
| --- | --- |
| Login / Cadastro | Autenticação por e-mail e senha (Supabase Auth), com validação (zod). |
| Início | Contadores de itens **vencidos / vencendo (≤ 3 dias) / em dia**, lista "Precisa de atenção" e atalho **Escanear produto**. |
| Meus itens | Lista ordenada pela validade, com busca e filtros por status, local e categoria. Botão flutuante para escanear. |
| Escanear produto | Câmera lê código de barras (EAN/UPC/Code128/Code39) ou QR Code e identifica o produto. |
| Novo / Editar item | Formulário validado: nome, validade, quantidade, unidade, local, categoria, observações e código de barras. |
| Ajustes | Status da sincronização, pendências, botão "Sincronizar agora" e logout. |
| Banco local (SQLite) | Mostra o caminho do arquivo `.db`, a consulta SQL executada e as linhas da tabela `pantry_items` com o `sync_status` de cada uma (usada na demonstração). |
| Nuvem (Supabase) | Consulta a tabela `pantry_items` direto no PostgreSQL do Supabase, para comparar com o banco local lado a lado (usada na demonstração). |

O indicador no topo das telas mostra o estado da sincronização (sincronizado, pendente, offline ou erro). Tocar nele dispara uma sincronização.

**Categorias:** Hortifrúti, Laticínios, Carnes, Grãos e massas, Padaria, Enlatados, Congelados, Bebidas, Limpeza e Outros.
**Locais:** Armário, Geladeira e Freezer. **Unidades:** un, kg, g, L, mL e pacote.

## 3. Tecnologias

| Área | Tecnologia |
| --- | --- |
| Plataforma | **Expo SDK 58**, **React Native 0.88**, **React 19**, **TypeScript** (strict) |
| Navegação | **Expo Router** (rotas por arquivos, abas e rotas protegidas com `Stack.Protected`) |
| Banco local | **expo-sqlite**, com migrations versionadas via `PRAGMA user_version` |
| Backend | **Supabase** (`@supabase/supabase-js`): Auth e PostgreSQL com RLS. Sessão persistida com `expo-sqlite/localStorage` |
| Visão computacional | **expo-camera** (`CameraView` + `onBarcodeScanned`) e API do **Open Food Facts** |
| Validação | **zod** |
| Estado global | **zustand** (sessão e sincronização) |
| Conectividade | **@react-native-community/netinfo** |
| Outros | `expo-crypto` (UUIDs), `@react-native-community/datetimepicker`, `@expo/vector-icons` |
| Qualidade | **Jest** (`jest-expo`), ESLint (`eslint-config-expo`), `tsc --noEmit` |

## 4. Arquitetura

**Clean Architecture + MVVM, organizada por feature.**

```
src/
├── app/                      # Rotas (Expo Router): só a "casca" das telas
│   ├── _layout.tsx           # SQLiteProvider + container de DI + guarda de autenticação
│   ├── (auth)/               # login, register
│   └── (app)/                # área logada
│       ├── (tabs)/           # index (Início), items (Meus itens), settings (Ajustes)
│       ├── items/            # new, [id], scan
│       └── debug/            # local-db, remote-db (demonstração)
├── core/                     # Infraestrutura transversal
│   ├── di/                   # Composition root (container.ts) + ContainerProvider
│   ├── errors/               # AppError + Result<T> (erros tipados, sem throw na UI)
│   ├── events/               # ChangeNotifier (Observer: dados locais mudaram)
│   └── theme/ utils/ config/
├── infra/                    # Adaptadores externos
│   ├── database/             # migrations do SQLite
│   ├── supabase/             # cliente + tipos do schema
│   ├── network/              # NetworkMonitor (NetInfo)
│   └── catalog/              # consulta ao Open Food Facts
├── features/
│   ├── auth/                 # domain (User, AuthRepository, casos de uso) · data (Supabase) · presentation
│   ├── pantry/               # domain (entidade, regras de validade, casos de uso) · data (SQLite/Supabase) · presentation
│   └── sync/                 # domain (SyncService) · data (SyncServiceImpl) · presentation (status, ajustes)
└── shared/                   # Componentes de UI reutilizáveis e hooks genéricos
supabase/migrations/          # Scripts SQL do backend (001_init, 002_add_barcode)
```

Cada feature segue as mesmas camadas:

| Camada | Responsabilidade | Conhece |
| --- | --- | --- |
| `presentation` | Telas (View) e ViewModels (hooks) | casos de uso |
| `domain` | Entidades, regras de negócio, casos de uso e interfaces de repositório | nada externo |
| `data` | Implementações dos repositórios, fontes de dados (SQLite/Supabase) e mappers | SQLite, Supabase |

Regras seguidas:

- O **domínio** não conhece React, SQLite nem Supabase. Por isso é testado com um repositório em memória.
- As **telas** só usam os ViewModels, e os ViewModels só chamam os casos de uso.
- As **dependências** são criadas num único lugar ([`src/core/di/container.ts`](src/core/di/container.ts)) e injetadas via Context. Assim fica fácil trocar uma implementação ou usar fakes nos testes.
- Erros são tratados com o tipo `Result<T>` (`ok` / `fail`), sem `throw` chegando na interface.

### Padrões de projeto utilizados

- **Repository**: `PantryRepository` / `AuthRepository` isolam a origem dos dados.
- **Use Case**: uma classe por ação do usuário (criar, editar, excluir, listar, escanear...).
- **MVVM**: View (tela) + ViewModel (hook) separados.
- **Dependency Injection**: container de composição + Context.
- **Observer**: `ChangeNotifier` avisa a UI e a sincronização quando o banco local muda.
- **Result**: retorno tipado de sucesso ou erro.

## 5. Fluxo do sistema

```
Tela (View) → ViewModel (hook) → Caso de uso → Repositório (interface)
                                                    │
                                   PantryRepositoryImpl → SQLite  (fonte da verdade)
                                                    │
                                   SyncService ──push/pull──→ Supabase (PostgreSQL)
```

**Inicialização do app** (`src/app/_layout.tsx`):

1. Verifica se o `.env` do Supabase está configurado (senão mostra a tela de configuração ausente).
2. Abre o SQLite e executa as migrations pendentes.
3. Monta o container de dependências.
4. Restaura a sessão salva e libera só as rotas permitidas: `(auth)` para quem não está logado e `(app)` para quem está.

**Cadastro de um item (manual):** Meus itens → formulário → validação (zod) → `CreatePantryItemUseCase` → grava no SQLite com `sync_status = 'pending'` → o `ChangeNotifier` avisa → a sincronização envia ao Supabase em ~1,5 s.

**Cadastro por câmera:** veja a [seção 8](#8-visão-computacional-código-de-barras--qr-code).

**Regra de validade** ([`ExpirationStatus.ts`](src/features/pantry/domain/entities/ExpirationStatus.ts)): `vencido` quando faltam menos de 0 dias, `vencendo` quando faltam de 0 a 3 dias e `em dia` acima disso.

## 6. Modelo de dados

Tabela `pantry_items` (mesmo desenho no SQLite e no PostgreSQL):

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | uuid / text (PK) | Gerado no aparelho (permite criar itens offline) |
| `user_id` | uuid | Dono do item (`auth.users`) |
| `name` | text | 2 a 80 caracteres |
| `category` | text | Uma das 10 categorias |
| `storage_location` | text | `pantry`, `fridge` ou `freezer` |
| `quantity` | numeric | Maior que zero |
| `unit` | text | `un`, `kg`, `g`, `l`, `ml` ou `pct` |
| `expiration_date` | date | Formato `YYYY-MM-DD` |
| `notes` | text | Opcional, até 300 caracteres |
| `barcode` | text | Código lido pela câmera (opcional) |
| `created_at` / `updated_at` | timestamp | No servidor, `updated_at` é definido por trigger |
| `deleted_at` | timestamp | Exclusão lógica |
| `sync_status` | text | **Só no SQLite:** `pending` ou `synced` |

O SQLite também tem a tabela `sync_meta` (guarda o cursor da última sincronização).

**Migrations:**

- SQLite: [`src/infra/database/migrations.ts`](src/infra/database/migrations.ts), versionadas por `PRAGMA user_version` (v1: tabelas, v2: coluna `barcode`).
- Supabase: [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) e [`002_add_barcode.sql`](supabase/migrations/002_add_barcode.sql).

## 7. Sincronização offline-first

1. Toda escrita vai para o SQLite com `sync_status = 'pending'`. A exclusão é **lógica** (`deleted_at`), para que a remoção também seja sincronizada.
2. **Push:** as linhas pendentes são enviadas com `upsert` ao Supabase e marcadas como `synced`, mas só se não mudaram durante o envio.
3. **Pull:** o app baixa o que mudou desde o último cursor (`updated_at` definido pelo **servidor**). A versão do servidor substitui as linhas locais já sincronizadas; linhas ainda `pending` são preservadas e enviadas no próximo push. Como só o relógio do servidor é usado, um celular com horário errado não atrapalha.
4. **Quando a sincronização acontece:** ao abrir o app ou fazer login, quando a internet volta, quando o app volta ao primeiro plano, 1,5 s após uma alteração local, no pull-to-refresh e pelo botão "Sincronizar agora".
5. Um lock impede que duas sincronizações rodem ao mesmo tempo.

## 8. Visão Computacional: código de barras / QR Code

- **Tecnologia:** `expo-camera` (`CameraView` + `onBarcodeScanned`), com leitura de EAN-13/8, UPC, Code128, Code39 e QR Code. A permissão de câmera é configurada em `app.json`.
- **Fluxo** (`LookupProductByBarcodeUseCase`):
  1. Se o código **já existe no SQLite**, abre o item para edição.
  2. Senão, consulta o **Open Food Facts** (e as bases irmãs de produtos gerais e de higiene) e pré-preenche **nome e categoria**.
  3. **Offline** ou produto não encontrado: preenche só o código e o usuário completa os dados.
  4. O usuário informa a validade e salva.
- **Categoria automática:** as tags do catálogo são convertidas para as categorias do app (`mapCategoryTags`).
- **Código:** [`BarcodeScannerScreen`](src/features/pantry/presentation/screens/BarcodeScannerScreen.tsx), [`useBarcodeScannerViewModel`](src/features/pantry/presentation/viewmodels/useBarcodeScannerViewModel.ts), [`openFoodFacts.ts`](src/infra/catalog/openFoodFacts.ts). A consulta ao catálogo é abstraída, então os testes rodam sem rede.
- **SQLite:** coluna `barcode` (migração v2) com índice; busca por `PantryLocalDataSource.findByBarcode`.
- **Supabase:** rode `supabase/migrations/002_add_barcode.sql` no SQL Editor. O código sobe pela sincronização existente.
- **Demo:** Início → Escanear produto → cadastrar → Ajustes → Banco local (coluna `barcode`) → Sincronizar → Nuvem (Supabase).

## 9. Segurança

- **RLS (Row Level Security)** ativo no PostgreSQL: cada usuário só lê, cria e altera os **próprios** itens. Não existe policy de DELETE (remoção é lógica).
- O app usa apenas a **Publishable key** do Supabase, que é pública por definição e protegida pelo RLS. Nunca use a `service_role` key no app.
- O arquivo `.env` está no `.gitignore` e **não é versionado**. Use o `.env.example` como modelo.

## 10. Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org) LTS e npm
- Conta gratuita no [Supabase](https://supabase.com)
- App **Expo Go** no celular (Android/iOS) ou um emulador Android/iOS

### 10.1 Criar o backend no Supabase

1. Crie um projeto gratuito em <https://supabase.com>.
2. Abra **SQL Editor → New query**, cole o conteúdo de [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) e clique em **Run**. Isso cria a tabela, os índices, o trigger e o RLS.
3. Repita com [`supabase/migrations/002_add_barcode.sql`](supabase/migrations/002_add_barcode.sql) (coluna do código de barras).
4. **Para facilitar a demonstração:** em **Authentication → Sign In / Providers → Email**, desative **Confirm email**. Assim o cadastro já entra direto no app.
5. Em **Project Settings → API Keys**, copie a *Project URL* e a *Publishable key*.

### 10.2 Configurar e iniciar o app

```bash
git clone https://github.com/caua-mendonca/despensa-app.git
cd despensa-app
npm install
cp .env.example .env        # preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npx expo start -c
```

No Windows (PowerShell), use `Copy-Item .env.example .env` no lugar do `cp`.

Depois, leia o QR Code com o app **Expo Go** ou pressione `a` para abrir no emulador Android. Na primeira vez que abrir o scanner, permita o uso da câmera.

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto (`https://xxxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública (`sb_publishable_...`) |

Sem essas variáveis, o app abre uma tela explicando o que falta configurar.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento do Expo |
| `npm run android` / `ios` / `web` | Inicia já abrindo na plataforma |
| `npm test` | Testes unitários |
| `npm run typecheck` | Verificação de tipos (TypeScript) |
| `npm run lint` | ESLint |

## 11. Qualidade e testes

```bash
npm test            # 29 testes unitários (domínio, SQLite e sincronização)
npm run typecheck   # TypeScript
npm run lint        # ESLint
npx expo-doctor     # saúde do projeto Expo
```

| Suíte | O que cobre |
| --- | --- |
| `ExpirationStatus.test.ts` | Regra de vencido / vencendo / em dia |
| `PantryUseCases.test.ts` | Casos de uso de itens, usando repositório em memória |
| `LookupProductByBarcodeUseCase.test.ts` | Leitura de código: item existente, catálogo, offline e categoria |
| `PantryLocalDataSource.test.ts` | Camada de dados SQLite |
| `SyncServiceImpl.test.ts` | Push, pull, conflitos e lock da sincronização |

## 12. Roteiro da apresentação (≈ 10 min)

| Tempo | Etapa | O que mostrar |
| --- | --- | --- |
| 0:00–1:30 | **Problema** | O desperdício de alimentos em casa e a proposta do ValidaJá. |
| 1:30–4:00 | **App funcionando** | Cadastro/login, criar 3 itens (um vencido, um vencendo e um em dia), Dashboard, filtros da lista, edição. |
| 4:00–5:00 | **Visão computacional** | Escanear o código de barras de um produto: nome e categoria vêm preenchidos, informar a validade e salvar. |
| 5:00–7:00 | **Expo SQLite** | Ativar o **modo avião** e criar um item. Ele aparece normalmente, e o indicador mostra "1 pendente(s)". Em *Ajustes → Ver banco local (SQLite)*, a linha aparece com `sync_status = pending`. |
| 7:00–9:00 | **Supabase** | Desativar o modo avião. A sincronização é automática e a linha passa para `synced`. No **Table Editor** do Supabase, mostrar o registro. Editar um campo por lá, puxar a lista para baixo no app e ver a mudança chegar. Excluir um item e mostrar o `deleted_at`. |
| 9:00–10:00 | **Arquitetura** | Camadas, RLS (cada usuário só vê os próprios dados) e testes. |

## 13. Licença

O arquivo [`LICENSE`](LICENSE) (MIT) veio do template inicial do Expo.
Projeto desenvolvido para fins acadêmicos.
