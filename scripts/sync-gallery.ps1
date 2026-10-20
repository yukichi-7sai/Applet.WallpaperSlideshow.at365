$ErrorActionPreference = 'Stop'
$appletRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$hostRoot = [IO.Path]::GetFullPath((Join-Path $appletRoot '..\AppDock.at365'))
& (Join-Path $hostRoot 'dev.bat') run build:image-gallery
if ($LASTEXITCODE -ne 0) { throw 'Common image gallery build failed.' }
$source = Join-Path $hostRoot 'out\ui\image-gallery'
$manifest = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
$version = (Get-Content -LiteralPath (Join-Path $hostRoot 'package.json') -Raw | ConvertFrom-Json).version
if ($manifest.apiVersion -ne 1 -or $manifest.version -ne $version) { throw 'Unsupported gallery bundle or version mismatch.' }
foreach ($entry in $manifest.sources.PSObject.Properties) {
    $file = [IO.Path]::GetFullPath((Join-Path $hostRoot $entry.Name))
    if (-not $file.StartsWith($hostRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid gallery source path.' }
    if ((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ne $entry.Value) { throw "Gallery source mismatch: $($entry.Name)" }
}
$files = @('image-gallery.js', 'gallery.css')
if (@($manifest.files.PSObject.Properties).Count -ne $files.Count) { throw 'Unexpected gallery bundle files.' }
foreach ($file in $files) {
    if ((Get-FileHash -LiteralPath (Join-Path $source $file) -Algorithm SHA256).Hash -ne $manifest.files.$file) { throw "Gallery hash mismatch: $file" }
}
$target = Join-Path $appletRoot 'web\vendor\image-gallery'
New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($file in ($files + @('manifest.json'))) { Copy-Item -LiteralPath (Join-Path $source $file) -Destination (Join-Path $target $file) -Force }
foreach ($file in $files) {
    if ((Get-FileHash -LiteralPath (Join-Path $target $file) -Algorithm SHA256).Hash -ne $manifest.files.$file) { throw "Copied gallery hash mismatch: $file" }
}
Write-Output "Shared gallery $version verified and bundled."