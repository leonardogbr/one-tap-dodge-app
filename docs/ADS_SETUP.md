# Configuração de anúncios (AdMob)

O jogo usa **react-native-google-mobile-ads** e **react-native-config** para ler App IDs e Ad Unit IDs de variáveis de ambiente. Em desenvolvimento ou quando `.env` não está configurado, são usados os **IDs de teste** do Google.

**Importante:** O arquivo `.env` não deve ser commitado (está no `.gitignore`). Use `.env.example` como referência e preencha `.env` localmente com os valores do seu console AdMob.

---

## 1. Conta e app no AdMob

- Crie uma conta em [AdMob](https://admob.google.com).
- Crie um **app** para Android e outro para iOS (ou um app para os dois).
- Anote os **App IDs** (ex.: `ca-app-pub-XXXXXXXX~YYYYYYYY`).
- Crie unidades de anúncio **Rewarded** (revive) e **Interstitial** para cada plataforma e anote os **Ad unit IDs** (ex.: `ca-app-pub-XXXXXXXX/ZZZZZZZZ`).

---

## 2. Variáveis de ambiente

As chaves são lidas do arquivo `.env` na raiz do projeto.

| Variável | Uso |
|----------|-----|
| `ADMOB_APP_ID_ANDROID` | App ID do AdMob para Android (AndroidManifest) |
| `ADMOB_APP_ID_IOS` | App ID do AdMob para iOS (Info.plist) |
| `ADMOB_REWARDED_UNIT_ID_ANDROID` | Ad unit ID da unidade Rewarded (Android) |
| `ADMOB_REWARDED_UNIT_ID_IOS` | Ad unit ID da unidade Rewarded (iOS) |
| `ADMOB_INTERSTITIAL_UNIT_ID_ANDROID` | Ad unit ID da unidade Interstitial (Android) |
| `ADMOB_INTERSTITIAL_UNIT_ID_IOS` | Ad unit ID da unidade Interstitial (iOS) |

**Como configurar:**

1. Copie `.env.example` para `.env`:  
   `cp .env.example .env`
2. Abra `.env` e preencha cada variável com os valores do console AdMob.
3. Não commite `.env` (ele já está no `.gitignore`).

Em `__DEV__` ou quando alguma variável não está definida, o app usa os Test IDs do Google; anúncios de teste podem aparecer.

---

## 3. Android

- O **App ID** é injetado no `AndroidManifest.xml` a partir de `ADMOB_APP_ID_ANDROID` no `.env` (via `react-native-config` e `manifestPlaceholders`).
- Se `ADMOB_APP_ID_ANDROID` não estiver definido, o build usa o App ID de teste do Google (`ca-app-pub-3940256099942544~3347511713`).
- Nenhuma alteração manual no `AndroidManifest.xml` é necessária para o App ID; ele já usa o placeholder `${ADMOB_APP_ID}`.

---

## 4. iOS

O App ID do iOS é lido de `ADMOB_APP_ID_IOS` e injetado no `Info.plist` via xcconfig. É preciso configurar o projeto uma vez no Xcode.

### 4.1. Arquivo de configuração

- O projeto já inclui `ios/Config.xcconfig`, que faz `#include? "tmp.xcconfig"`.
- O arquivo `ios/tmp.xcconfig` é gerado antes de cada build a partir do `.env` e **não** deve ser commitado (está no `.gitignore`).

### 4.2. Usar Config.xcconfig no projeto

1. Abra o projeto no Xcode (`ios/OneTapDodge.xcworkspace`).
2. Selecione o **projeto** (ícone azul) no navegador.
3. Em **Info**, aba **Configurations**, em cada configuração (Debug / Release) defina **Based on Configuration File** para `Config` (ou o caminho para `Config.xcconfig` dentro de `ios/`).

### 4.3. Pre-action para gerar tmp.xcconfig

Para que as variáveis do `.env` estejam disponíveis no `Info.plist`, é necessário rodar o script do react-native-config antes de cada build:

1. No Xcode: **Product → Scheme → Edit Scheme…**
2. No painel esquerdo, selecione **Build**.
3. Marque **Pre-actions** e clique no **+** para adicionar **New Run Script Action**.
4. Em **Provide build settings from**, selecione o **target do app** (ex.: OneTapDodge).
5. Na caixa de script, cole:

   ```bash
   "${SRCROOT}/../node_modules/react-native-config/ios/ReactNativeConfig/BuildXCConfig.rb" "${SRCROOT}/.." "${SRCROOT}/tmp.xcconfig"
   ```

6. Feche o diálogo.

Assim, `tmp.xcconfig` será gerado a partir do `.env` antes de cada build e o `Info.plist` poderá usar `$(ADMOB_APP_ID_IOS)` para o `GADApplicationIdentifier`. Se `ADMOB_APP_ID_IOS` não estiver definido, o valor pode ficar em branco e o build/AdMob pode falhar; use sempre um `.env` preenchido para builds com anúncios reais.

---

## 5. Código (Ad Unit IDs)

Os Ad Unit IDs (rewarded e interstitial) são lidos em `src/services/ads.ts` via `react-native-config`, com fallback para os Test IDs em `__DEV__` ou quando a variável correspondente não está definida. Não é necessário alterar código para trocar IDs; basta configurar o `.env`.

---

## 6. Como garantir que a configuração está funcional (especialmente iOS)

Como há fallback para IDs de teste, fica difícil ter certeza só pelo comportamento do app. Abaixo, formas de validar:

**Android**

- Com `.env` preenchido: faça um build release e confira no APK/AAB que o App ID no manifest é o do seu app (ex.: inspecionar o manifest ou o valor em tempo de execução).
- Sem `ADMOB_APP_ID_ANDROID`: o build usa o App ID de teste; anúncios de teste aparecem. Ao definir a variável e rebuildar, deve passar a usar seu App ID.

**iOS**

- **Pre-action e xcconfig:** Antes de buildar no Xcode, confira se o script de Pre-action está rodando: após um build, verifique se o arquivo `ios/tmp.xcconfig` foi criado e se contém linhas como `ADMOB_APP_ID_IOS = ca-app-pub-...`. Se não existir ou estiver vazio, o Pre-action não está sendo executado ou o `.env` não está na raiz do projeto.
- **Config.xcconfig:** No Xcode, em **Info → Configurations**, confirme que Debug e Release usam **Based on Configuration File** apontando para `Config` (ou `Config.xcconfig`). Sem isso, o `Info.plist` não recebe as variáveis do `tmp.xcconfig`.
- **Valor no app (só em dev):** Para checar se o JS está vendo o valor do `.env`, você pode, **temporariamente** e só em desenvolvimento, fazer um `console.log` (ou um texto em tela de debug) com os primeiros caracteres do App ID ou do Ad Unit ID (ex.: `Config.ADMOB_APP_ID_IOS?.slice(0, 20)`). Não exponha o ID completo em produção. Se aparecer o valor do `.env`, o react-native-config está carregando; se aparecer `undefined`, o `tmp.xcconfig` não está sendo aplicado ou o Pre-action não rodou.
- **Comportamento com IDs reais:** Com as unidades aprovadas no AdMob, os anúncios reais não exibem o rótulo "Test ad". Ver anúncios sem esse rótulo após preencher o `.env` e rebuildar é um indício de que a config está em uso.

**Resumo:** Garantir que (1) o Pre-action gera `tmp.xcconfig` com os valores certos, (2) as configurações do projeto usam `Config.xcconfig` e (3), se quiser, um log pontual em dev confirma que o app está lendo as variáveis.

---

## 7. Pod install (iOS)

Depois de instalar ou alterar o pacote de ads ou o react-native-config, rode:

```bash
cd ios && pod install && cd ..
```

---

## Resumo

| O quê | Onde |
|-------|------|
| App ID Android | `.env` → `ADMOB_APP_ID_ANDROID` (AndroidManifest usa placeholder) |
| App ID iOS | `.env` → `ADMOB_APP_ID_IOS` (Info.plist usa `$(ADMOB_APP_ID_IOS)` + Pre-action) |
| Ad unit IDs | `.env` (variáveis `ADMOB_*_UNIT_ID_*`); `src/services/ads.ts` usa Config |
| Não commitar | `.env` (está no `.gitignore`); `ios/tmp.xcconfig` (gerado) |
| iOS: config + Pre-action | Xcode: Configurations → Config.xcconfig; Scheme → Build → Pre-actions |
| iOS: pod install | `cd ios && pod install` |
| Verificar config (iOS) | Ver seção 6: tmp.xcconfig gerado, Config.xcconfig aplicado, log em dev (opcional) |

Até configurar o `.env`, o app usa **IDs de teste** do Google; anúncios de teste podem aparecer.
