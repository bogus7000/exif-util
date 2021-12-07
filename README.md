# exif-cli

CLI for inspecting and comparing exif tags

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![License](https://img.shields.io/npm/l/exif-cli.svg)](https://github.com/kbd-overlord/exif-cli/blob/master/package.json)

<!-- [![Version](https://img.shields.io/npm/v/exif-cli.svg)](https://npmjs.org/package/exif-cli) -->
<!-- [![Downloads/week](https://img.shields.io/npm/dw/exif-cli.svg)](https://npmjs.org/package/exif-cli) -->

<!-- toc -->
* [exif-cli](#exif-cli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g exif-cli
$ exif-cli COMMAND
running command...
$ exif-cli (-v|--version|version)
exif-cli/0.0.2 linux-x64 node-v16.13.0
$ exif-cli --help [COMMAND]
USAGE
  $ exif-cli COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`exif-cli help [COMMAND]`](#exif-cli-help-command)
* [`exif-cli scan-dir [DIRECTORY]`](#exif-cli-scan-dir-directory)
* [`exif-cli scan-file [FILE]`](#exif-cli-scan-file-file)

## `exif-cli help [COMMAND]`

display help for exif-cli

```
USAGE
  $ exif-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.12/src/commands/help.ts)_

## `exif-cli scan-dir [DIRECTORY]`

Scan a directory with images images

```
USAGE
  $ exif-cli scan-dir [DIRECTORY]

ARGUMENTS
  DIRECTORY  Path to directory

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/scan-dir.ts](https://github.com/kbd-overlord/exif-cli/blob/v0.0.2/src/commands/scan-dir.ts)_

## `exif-cli scan-file [FILE]`

describe the command here

```
USAGE
  $ exif-cli scan-file [FILE]

ARGUMENTS
  FILE  Path file

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/scan-file.ts](https://github.com/kbd-overlord/exif-cli/blob/v0.0.2/src/commands/scan-file.ts)_
<!-- commandsstop -->
