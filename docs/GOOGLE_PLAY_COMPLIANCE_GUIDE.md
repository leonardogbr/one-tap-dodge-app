# Guia de conformidade — One Tap Dodge no Google Play (Famílias e crianças)

Este guia reúne os passos e requisitos para publicar o **One Tap Dodge** na Google Play de forma **compatível com a Política do Programa para Famílias**, com **Política de Privacidade** e **Data Safety** corretos, e com anúncios adequados para crianças.

**Importante:** Qualquer falha pode resultar em rejeição ou remoção do app. Siga cada item com atenção.

---

## Resumo do que o app faz (para declarações)

- **Tipo:** Jogo casual (dodge/obstáculos), uma jogada por toque.
- **Público-alvo:** Todas as idades, incluindo crianças menores de 13 anos.
- **Dados:** Apenas dados locais no dispositivo (progresso do jogo, configurações). Nenhum servidor próprio, nenhum cadastro, nenhum dado pessoal coletado.
- **Anúncios:** Google AdMob (rewarded e intersticial), já configurados no código como **child-directed** e **G-rated**.
- **SDK de anúncios:** Google Mobile Ads (AdMob) — consta na lista de [SDKs de anúncios autocertificados para Famílias](https://support.google.com/googleplay/android-developer/answer/9283445).

---

## 1. Política de Privacidade (Privacy Policy)

### Obrigatório no Google Play

- Todo app, especialmente os que têm crianças no público-alvo, precisa de uma **Política de Privacidade** em uma **URL ativa e pública**.
- A política deve descrever claramente coleta, uso e compartilhamento de dados (incluindo dados tratados por SDKs, como o AdMob).

### O que já está no projeto

- **`docs/PRIVACY_POLICY.md`** (inglês) e **`docs/PRIVACY_POLICY_PT-BR.md`** (português) foram criados com base no código e nas funcionalidades do app.
- Antes de publicar:
  1. Substitua **[INSERT DATE]** / **[INSIRA A DATA]** pela data real.
  2. Substitua **[YOUR CONTACT EMAIL]** / **[SEU E-MAIL DE CONTATO]** por um e-mail de contato válido (ex.: suporte ou jurídico).
  3. Publique o conteúdo em uma página web estável (site próprio, GitHub Pages, etc.) e use essa **URL** no Play Console.

### Onde informar no Play Console

- **Política do app** (App content → App privacy policy): informe a **URL** da política (ex.: `https://seusite.com/privacy` ou `https://seusite.com/one-tap-dodge-privacy`).

---

## 2. Público-alvo e conteúdo (Target audience and content)

### Obrigatório

- Em **App content** → **Target audience and content** (ou equivalente), declare o **público-alvo** escolhendo os grupos de idade que se aplicam.
- Se o app é para **crianças e famílias**, marque os grupos que incluem menores de 13 anos (conforme as opções do Console).
- **Não** declare apenas “adultos” se o app for promovido ou adequado para crianças; isso pode ser considerado representação enganosa e levar à remoção.

### Sugestão para One Tap Dodge

- Marque as faixas que incluem crianças (ex.: “Ages 5 and under”, “Ages 6–8”, “Ages 9–12” e, se fizer sentido, “Ages 13+” ou “Everyone”), de acordo com as opções exatas do Console.
- Conteúdo do jogo: sem violência gráfica, sem apostas reais, sem conteúdo adulto — adequado para classificação “Everyone” / “Para todos”.

---

## 3. Data Safety (Declaração de dados)

- Em **App content** → **Data safety** (ou “Segurança dos dados”), preencha o formulário com **exatidão**. Declare tudo que o app **coleta** e **compartilha**, inclusive via SDKs.

### Para o One Tap Dodge (referência)

- **Dados coletados apenas no dispositivo (não enviados aos seus servidores):**
  - Progresso do jogo (pontuação, moedas, skins, desafios, estatísticas).
  - Preferências (som, música, vibração, tema, idioma).
  - Esses itens podem ser declarados como “dados do app” / “game progress” / “preferences”, indicando que são **armazenados apenas no dispositivo** e **não compartilhados** com terceiros (ou compartilhamento “No”).
- **Dados compartilhados com terceiros (Google AdMob):**
  - O SDK do AdMob pode coletar dados técnicos/ de uso para exibição de anúncios. O Google trata isso como child-directed quando configurado assim (como já está no código).
  - Declare que você **compartilha** dados com **provedores de anúncios** (Google) para “Anúncios ou marketing”, e que o app está configurado para **tratamento direcionado a crianças** (sem publicidade baseada em interesse).
- **Não** declare coleta de: nome, e-mail, telefone, localização, identificadores de publicidade (AAID) para perfil de usuário, etc., pois o app não coleta isso.
- **Link da Política de Privacidade:** obrigatório no Data Safety; use a mesma URL da etapa 1.

Consulte sempre a [documentação oficial do Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469) e as definições atuais do formulário no Console.

---

## 4. Famílias e anúncios (Families policy & ads)

### Requisitos principais

- Apps que têm **crianças** no público-alvo devem:
  - Usar **apenas** SDKs de anúncios que estejam na lista de [SDKs autocertificados para Famílias](https://support.google.com/googleplay/android-developer/answer/9283445). O **Google AdMob** está nessa lista.
  - **Não transmitir** de crianças (ou usuários de idade desconhecida): AAID, IMEI, IMSI, MAC, SSID, BSSID, Build Serial, SIM Serial, número de telefone.
  - Para apps que **só** têm crianças como alvo: no Android, com **API 33+**, **não** solicitar a permissão **AD_ID** (o projeto já remove essa permissão no `AndroidManifest.xml`).
  - Exibir apenas anúncios **adequados a crianças** (formato e conteúdo), sem interesse baseado em perfil/remarketing para esse tráfego.

### O que já está implementado no código

1. **`src/services/ads.ts`**
   - Antes de `initialize()`, é chamado `setRequestConfiguration` com:
     - `tagForChildDirectedTreatment: true` (COPPA / Famílias).
     - `tagForUnderAgeOfConsent: true` (GDPR/EEE).
     - `maxAdContentRating: MaxAdContentRating.G` (apenas conteúdo G).
   - Isso garante que o AdMob sirva anúncios em conformidade com Famílias e sem uso de AAID para segmentação.

2. **`android/app/src/main/AndroidManifest.xml`**
   - Inclusão de `tools:node="remove"` para a permissão `com.google.android.gms.permission.AD_ID`, para que o app **não** use o ID de publicidade no Android (compatível com “app somente para crianças”).

### Formato dos anúncios (Families ad format)

- Intersticiais **não** na abertura imediata do app (no One Tap Dodge aparecem após N game overs).
- Anúncios recompensados são **opt-in** (usuário escolhe assistir para reviver).
- Anúncios devem ser **fecháveis** em tempo razoável (ex.: 5 segundos), claramente distinguíveis do conteúdo do jogo e sem múltiplos anúncios na mesma tela de forma confusa.
- O uso atual do app (intersticial após várias partidas; rewarded opcional) está alinhado com essas regras.

---

## 5. Checklist antes de enviar para revisão

- [ ] **Política de Privacidade** publicada em URL estável; datas e e-mail de contato preenchidos.
- [ ] **Play Console** → App content → **Privacy policy**: URL da política informada.
- [ ] **Target audience**: faixas etárias corretas (incluindo crianças, se for o caso).
- [ ] **Data Safety**: formulário preenchido de acordo com os dados reais (local + AdMob); link da política incluído.
- [ ] **Anúncios**: uso apenas do AdMob, com configuração child-directed e G-rated já no código; nenhum outro SDK de anúncios não certificado para Famílias.
- [ ] **Android:** `targetSdkVersion` 33 ou superior; permissão AD_ID removida no manifest (já configurado).
- [ ] **Questionário de classificação de conteúdo** (content rating): respondido de forma coerente com um jogo casual sem violência, apostas ou conteúdo adulto.
- [ ] Nenhuma funcionalidade social (chat, perfis públicos, etc.) que exija declarações adicionais de “social features” ou “exchange of information” além do que você declarar.

---

## 6. Links úteis (documentação oficial)

- [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Data practices in Families apps](https://support.google.com/googleplay/android-developer/answer/11043825)
- [Families Self-Certified Ads SDK list](https://support.google.com/googleplay/android-developer/answer/9283445)
- [Provide information for Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455)
- [AdMob – Comply with Families Policy](https://support.google.com/admob/answer/6223431)

---

## 7. Contato e responsabilidade

- **Você** é responsável por garantir que todas as declarações no Play Console (público-alvo, Data Safety, política de privacidade, conteúdo e anúncios) correspondam ao comportamento real do app.
- Em caso de dúvida jurídica (COPPA, GDPR, leis locais), consulte um advogado.
- Este guia foi elaborado com base no código e na documentação do Google Play disponível na data de criação; consulte sempre as páginas oficiais mais recentes antes de publicar ou atualizar o app.
