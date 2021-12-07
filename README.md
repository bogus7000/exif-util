# exif-util

CLI for inspecting and comparing exif tags

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![License](https://img.shields.io/npm/l/exif-util.svg)](https://github.com/kbd-overlord/exif-util/package.json)

<!-- [![Version](https://img.shields.io/npm/v/exif-util.svg)](https://npmjs.org/package/exif-util) -->
<!-- [![Downloads/week](https://img.shields.io/npm/dw/exif-util.svg)](https://npmjs.org/package/exif-util) -->

<!-- toc -->

- [exif-util](#exif-util)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g exif-util
$ exif-util COMMAND
running command...
$ exif-util (-v|--version|version)
exif-util/0.0.2 linux-x64 node-v16.13.0
$ exif-util --help [COMMAND]
USAGE
  $ exif-util COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`exif-util help [COMMAND]`](#exif-util-help-command)
- [`exif-util scan-dir [DIRECTORY]`](#exif-util-scan-dir-directory)
- [`exif-util scan-file [FILE]`](#exif-util-scan-file-file)

## `exif-util help [COMMAND]`

display help for exif-util

```
USAGE
  $ exif-util help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.12/src/commands/help.ts)_

## `exif-util scan-dir [DIRECTORY]`

Scan a directory with images images

```
USAGE
  $ exif-util scan-dir [DIRECTORY]

ARGUMENTS
  DIRECTORY  Path to directory

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/scan-dir.ts](https://github.com/kbd-overlord/exif-util/blob/v0.0.2/src/commands/scan-dir.ts)_

## `exif-util scan-file [FILE]`

describe the command here

```
USAGE
  $ exif-util scan-file [FILE]

ARGUMENTS
  FILE  Path file

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/scan-file.ts](https://github.com/kbd-overlord/exif-util/blob/v0.0.2/src/commands/scan-file.ts)_

<!-- commandsstop -->
