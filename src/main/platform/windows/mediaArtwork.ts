import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { powerShellLiteral } from './powershell';

// PowerShell loses the interface type of a WinRT stream returned through AsTask.
// Keep that conversion in typed CLR code, compiled once into a per-user cache.
const source = String.raw`
using Windows.Storage.Streams;
public static class RippleMediaArtwork {
  public static ulong Size(object raw) { return ((IRandomAccessStreamWithContentType)raw).Size; }
  public static string Mime(object raw) { return ((IRandomAccessStreamWithContentType)raw).ContentType; }
  public static DataReader Reader(object raw) { return new DataReader(((IRandomAccessStreamWithContentType)raw).GetInputStreamAt(0)); }
}
`;
export async function mediaArtworkBridge(): Promise<string> {
  const directory = path.join(os.tmpdir(), 'Ripple Next', 'media');
  await fs.mkdir(directory, { recursive: true });
  const file = path.join(
    directory,
    createHash('sha256').update(source).digest('hex').slice(0, 16) + '.dll',
  );
  return (
    String.raw`
$artworkAssembly = ` +
    powerShellLiteral(file) +
    String.raw`
if (-not (Test-Path -LiteralPath $artworkAssembly)) {
  $code = @'
` +
    source +
    String.raw`
'@
  $compiler = New-Object Microsoft.CSharp.CSharpCodeProvider
  $parameters = New-Object System.CodeDom.Compiler.CompilerParameters
  $parameters.GenerateInMemory = $false
  $stagingAssembly = $artworkAssembly + '.' + [Guid]::NewGuid().ToString('N') + '.dll'
  $parameters.OutputAssembly = $stagingAssembly
  @('System.Runtime.dll',(Join-Path $env:SystemRoot 'System32/WinMetadata/Windows.Storage.winmd'),(Join-Path $env:SystemRoot 'System32/WinMetadata/Windows.Foundation.winmd')) | ForEach-Object { $null = $parameters.ReferencedAssemblies.Add($_) }
  try {
    $compiled = $compiler.CompileAssemblyFromSource($parameters,$code)
    if ($compiled.Errors.HasErrors) { throw 'Media artwork bridge compilation failed' }
    try { Move-Item -LiteralPath $stagingAssembly -Destination $artworkAssembly -ErrorAction Stop }
    catch { if (-not (Test-Path -LiteralPath $artworkAssembly)) { throw } }
  } finally {
    $compiler.Dispose()
    if (Test-Path -LiteralPath $stagingAssembly) { Remove-Item -LiteralPath $stagingAssembly }
  }
}
$null = [Reflection.Assembly]::LoadFrom($artworkAssembly)
`
  );
}
