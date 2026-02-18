# Fontes do app

## Arquivos que você precisa colar aqui

Coloque **nesta pasta** (`assets/fonts/`) estes **9 arquivos** da Inter (conjunto estático 18pt, 24pt e 28pt). Os nomes devem ser **exatamente** esses. Não use os variable fonts; use só os estáticos.

| Tamanho óptico | Arquivo |
|----------------|--------|
| **18pt** (texto pequeno) | `Inter_18pt-Regular.ttf` |
| | `Inter_18pt-SemiBold.ttf` |
| | `Inter_18pt-Bold.ttf` |
| **24pt** (texto médio) | `Inter_24pt-Regular.ttf` |
| | `Inter_24pt-SemiBold.ttf` |
| | `Inter_24pt-Bold.ttf` |
| **28pt** (títulos) | `Inter_28pt-Regular.ttf` |
| | `Inter_28pt-SemiBold.ttf` |
| | `Inter_28pt-Bold.ttf` |

Uso no design system: 18pt para caption/bodySmall/label; 24pt para body/h3/h4/botões; 28pt para h1/h2.

## Depois de colar

1. Na raiz do projeto, rode:
   ```bash
   npm run link-assets
   ```
   (Ou `npx react-native-asset`. Isso copia as fontes para o Android. No iOS já estão registradas no `Info.plist`.)

2. Recompile o app:
   - iOS: `npx react-native run-ios` (ou abra o Xcode e dê Run).
   - Android: `npx react-native run-android`.

Pronto. O design system já está configurado para usar Inter com os três tamanhos ópticos.
