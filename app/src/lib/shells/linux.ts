import { spawn, ChildProcess } from 'child_process'
import { pathExists } from '../file-system'
import { assertNever } from '../fatal-error'
import { IFoundShell } from './found-shell'

export enum Shell {
  Gnome = 'GNOME Terminal',
  Tilix = 'Tilix',
  Urxvt = 'URxvt',
  Konsole = 'Konsole',
  Xterm = 'XTerm',
  PowerShellCore = 'PowerShell Core',
}

export const Default = Shell.Gnome

export function parse(label: string): Shell {
  if (label === Shell.Gnome) {
    return Shell.Gnome
  }

  if (label === Shell.Tilix) {
    return Shell.Tilix
  }

  if (label === Shell.Urxvt) {
    return Shell.Urxvt
  }

  if (label === Shell.Konsole) {
    return Shell.Konsole
  }

  if (label === Shell.Xterm) {
    return Shell.Xterm
  }

  if (label === Shell.PowerShellCore) {
    return Shell.PowerShellCore
  }

  return Default
}

async function getPathIfAvailable(path: string): Promise<string | null> {
  return (await pathExists(path)) ? path : null
}

function getShellPath(shell: Shell): Promise<string | null> {
  switch (shell) {
    case Shell.Gnome:
      return getPathIfAvailable('/usr/bin/gnome-terminal')
    case Shell.Tilix:
      return getPathIfAvailable('/usr/bin/tilix')
    case Shell.Urxvt:
      return getPathIfAvailable('/usr/bin/urxvt')
    case Shell.Konsole:
      return getPathIfAvailable('/usr/bin/konsole')
    case Shell.Xterm:
      return getPathIfAvailable('/usr/bin/xterm')
    case Shell.PowerShellCore:
      return getPathIfAvailable('/usr/bin/pwsh')
    default:
      return assertNever(shell, `Unknown shell: ${shell}`)
  }
}

export async function getAvailableShells(): Promise<
  ReadonlyArray<IFoundShell<Shell>>
> {
  const [
    gnomeTerminalPath,
    tilixPath,
    urxvtPath,
    konsolePath,
    xtermPath,
    powerShellCorePath,
  ] = await Promise.all([
    getShellPath(Shell.Gnome),
    getShellPath(Shell.Tilix),
    getShellPath(Shell.Urxvt),
    getShellPath(Shell.Konsole),
    getShellPath(Shell.Xterm),
    getShellPath(Shell.PowerShellCore),
  ])

  const shells: Array<IFoundShell<Shell>> = []
  if (gnomeTerminalPath) {
    shells.push({ shell: Shell.Gnome, path: gnomeTerminalPath })
  }

  if (tilixPath) {
    shells.push({ shell: Shell.Tilix, path: tilixPath })
  }

  if (urxvtPath) {
    shells.push({ shell: Shell.Urxvt, path: urxvtPath })
  }

  if (konsolePath) {
    shells.push({ shell: Shell.Konsole, path: konsolePath })
  }

  if (xtermPath) {
    shells.push({ shell: Shell.Xterm, path: xtermPath })
  }

  if (powerShellCorePath) {
    shells.push({ shell: Shell.PowerShellCore, path: powerShellCorePath })
  }

  return shells
}

export function launch(
  foundShell: IFoundShell<Shell>,
  path: string
): ChildProcess {
  const shell = foundShell.shell
  switch (shell) {
    case Shell.Urxvt:
      return spawn(foundShell.path, ['-cd', path])
    case Shell.Konsole:
      return spawn(foundShell.path, ['--workdir', path])
    case Shell.Xterm:
      return spawn(foundShell.path, ['-e', '/bin/bash'], { cwd: path })
    case Shell.Tilix:
    case Shell.Gnome:
      return spawn(foundShell.path, ['--working-directory', path])
    case Shell.PowerShellCore:
      const psCoreCommand = `"Set-Location -LiteralPath '${path}'"`
      return spawn(foundShell.path, [
        'pwsh',
        '-NoExit',
        '-Command',
        psCoreCommand,
      ])
    default:
      return assertNever(shell, `Unknown shell: ${shell}`)
  }
}
