param([string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$taskAppletRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
. ([IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\AppDock.at365\scripts\publish-paths.ps1')))
$taskArtifact = Get-PublishDirectory $taskAppletRoot
$taskPublishDirectory = if ($OutputDirectory) { [System.IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $taskArtifact 'Applet.WallpaperSlideshow.at365' }
$taskManifest = Get-Content -LiteralPath (Join-Path $taskAppletRoot 'extension.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$taskProject = [xml](Get-Content -LiteralPath (Join-Path $taskAppletRoot 'Applet.WallpaperSlideshow\Applet.WallpaperSlideshow.csproj') -Raw)
if ($taskManifest.version -ne $taskProject.Project.PropertyGroup.Version) { throw 'EXEとmanifestのバージョンが一致しません。' }
dotnet publish (Join-Path $taskAppletRoot 'Applet.WallpaperSlideshow\Applet.WallpaperSlideshow.csproj') -c Release -r win-x64 --self-contained true -o $taskPublishDirectory
if ($LASTEXITCODE -ne 0) { throw "Wallpaper Applet publish failed ($LASTEXITCODE)" }
foreach ($taskWebAsset in @('history.html', 'history.js', 'history-preferences.js', 'memory-images.js', 'history.css', 'vendor\image-gallery\image-gallery.js', 'vendor\image-gallery\gallery.css', 'vendor\image-gallery\manifest.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $taskPublishDirectory ('web\' + $taskWebAsset)) -PathType Leaf)) { throw "Missing page asset: $taskWebAsset" }
    if ((Get-FileHash -LiteralPath (Join-Path $taskPublishDirectory ('web\' + $taskWebAsset))).Hash -ne
        (Get-FileHash -LiteralPath (Join-Path $taskAppletRoot ('web\' + $taskWebAsset))).Hash) { throw "Page asset mismatch: $taskWebAsset" }
}
Copy-Item -LiteralPath (Join-Path $taskAppletRoot 'extension.json') -Destination (Join-Path $taskPublishDirectory 'extension.json') -Force
$taskProductVersion = [Diagnostics.FileVersionInfo]::GetVersionInfo((Join-Path $taskPublishDirectory $taskManifest.entry)).ProductVersion.Split('+')[0]
if ($taskProductVersion -ne $taskManifest.version) { throw '発行されたEXEとmanifestのバージョンが一致しません。' }
foreach ($taskSymbols in @('AppDock.Runtime.pdb', 'AppDock.SDK.pdb')) {
    $taskSymbolFile = Join-Path $taskPublishDirectory $taskSymbols
    if (Test-Path -LiteralPath $taskSymbolFile -PathType Leaf) { Remove-Item -LiteralPath $taskSymbolFile }
}
Write-Output "Applet output: $taskPublishDirectory"

$taskUpdateHostRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\AppDock.at365'))
& (Join-Path $taskUpdateHostRoot 'scripts\pack-applet-update.ps1') -SourceDirectory $taskPublishDirectory -OutputDirectory $taskArtifact

Install-PublishedDeployment $taskAppletRoot $taskArtifact
