fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android build_native_app

```sh
[bundle exec] fastlane android build_native_app
```

Runs a clean flutter build

### android internal

```sh
[bundle exec] fastlane android internal
```

Build and upload to internal track

### android promote

```sh
[bundle exec] fastlane android promote
```

Promote version between tracks (ex.: internal -> production)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
