# Versão do app (major.minor.patch)

O app usa **versionamento semântico** `major.minor.patch` a partir de **0.1.0**.

Para **subir uma nova versão** nas lojas, atualize estes arquivos e depois gere o build de release.

## Onde alterar

### 1. Android — `android/app/build.gradle`

No bloco `defaultConfig`:

```groovy
versionCode 2        // Número inteiro: aumente a cada release na Play Store (1, 2, 3, …)
versionName "0.1.0"  // major.minor.patch (ex: 0.1.1, 0.2.0, 1.0.0)
```

- **versionCode**: a Play Store exige que cada novo APK/AAB tenha um `versionCode` **maior** que o anterior.
- **versionName**: segue major.minor.patch (ex.: 0.1.0, 0.1.1, 0.2.0, 1.0.0).

### 2. iOS — `ios/OneTapDodge.xcodeproj/project.pbxproj`

Procure por `MARKETING_VERSION` e `CURRENT_PROJECT_VERSION`. Altere **nas duas ocorrências** (Debug e Release):

```
MARKETING_VERSION = 0.1.0;   // major.minor.patch
CURRENT_PROJECT_VERSION = 2; // Build number: aumente a cada upload (1, 2, 3, …)
```

### 3. package.json (opcional)

Mantenha alinhado com a versão do app, ex.: `"version": "0.1.0"`.

## Exemplo: publicar 0.1.1

1. **Android** — `versionCode 2`, `versionName "0.1.1"`.
2. **iOS** — `MARKETING_VERSION = 0.1.1`, `CURRENT_PROJECT_VERSION = 2` (nas 2 ocorrências).
3. **package.json** — `"version": "0.1.1"` (se quiser).
4. Gere os builds de release e envie para as lojas.
