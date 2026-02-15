# One Tap Dodge — Fases do projeto

## Fase 1 — Core gameplay ✅
- Tap para trocar faixa; obstáculos caem; colisão = game over.
- Near-miss (+50); score ao longo do tempo; dificuldade escala (velocidade a cada 15s).
- Moedas (após 5s), streak de near-miss (5 seguidos → 2x moedas por 10s), escudo (meter com moedas).
- Telas: GameScreen, HUD. Obstáculos vermelhos.

## Fase 2 — Progression & persistence ✅
- Store Zustand (game, progress, settings).
- AsyncStorage + usePersistedStore: high score, totalCoins, skins, settings.
- SkinsScreen: desbloquear/equipar skins por moedas.

## Fase 3 — Monetization ✅
- react-native-google-mobile-ads.
- AdMob IDs via .env (react-native-config).
- Rewarded: revive (2 por partida); grace 2s e limpar obstáculos após revive.
- Interstitial: a cada 5 game overs (Play again / Skins).

## Fase 4 — Polish (em curso)

### Feito
- Micro-animações: near-miss badge, overlay idle/game over, botões (PressableScale), Skins fade-in, score bounce.
- Settings: toggles Sound, Music, Haptics (persistidos); opção “Remover anúncios” removida.
- Pause: botão no HUD, overlay Paused (Resume / Quit).
- Home: menu principal (Play, How to Play, Skins, Settings).
- Splash: loading → navegação para Home.
- How to Play: regras e controles.
- Botão Home no overlay do Game (idle/game over).
- **Haptics:** troca de faixa, near-miss, moeda, game over (respeita hapticsOn; sem haptic em botões).
- **Delay do interstitial:** refinamento do delay após fechar interstitial concluído.

### Em escopo (Fase 4 expandida)
| Item | Descrição |
|------|-----------|
| **Contagem regressiva** | Tela 3, 2, 1, Go antes de começar, resumir do pause ou após anúncio rewarded. |
| **Animação de colisão** | Animação ao bater (ex. explosão) e game over com entrada hero. |
| **Game over usável** | ~2 s de espera antes de permitir "Jogar de novo" para evitar tap acidental. |
| **Internacionalização** | pt-BR, espanhol, inglês; opção em configurações (idioma ou sistema). |
| **Light mode** | Tema claro; configurações: dark, light ou padrão do sistema. |
| **Animação troca de faixa** | Pequena animação na troca de lane. |
| **Safe area** | Garantir que nada fica sob notch/status bar. |
| **Skins distintas** | Skins visuais diferentes; mais opções e opções mais caras (top de linha). |
| **Som e música** | Ligar áudio real a soundOn/musicOn (lib + assets). |

---

## Próximas fases (planejadas)

### Fase 5 — Polish final & preparação para release
- Revisão geral de UX/UI e performance.
- Testes em dispositivos reais (vários tamanhos, Android/iOS).
- Preparar store listing (ícones, screenshots, descrições).
- Builds de release (assinatura, ProGuard, etc.).

### Fase 6+ (possível)
- Integração com design do Stitch (telas/fluxos desenhados).
- react-native-skia para efeitos visuais (se desejado).
- In-app purchase para “remover anúncios” (se for prioridade no futuro).

---

*Última atualização: conforme estado do repo e resumo da conversa.*
