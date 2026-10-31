param([string]$AppDockDirectory)
$ErrorActionPreference = 'Stop'
$taskAppletRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $AppDockDirectory) {
    $taskConfig = Join-Path $taskAppletRoot 'deploy.local.txt'
    if (Test-Path -LiteralPath $taskConfig -PathType Leaf) { $AppDockDirectory = Get-Content -LiteralPath $taskConfig -Encoding UTF8 -TotalCount 1 }
}
if ([string]::IsNullOrWhiteSpace($AppDockDirectory)) { throw 'Pass an AppDock directory or create deploy.local.txt.' }
$taskDestination = Join-Path ([IO.Path]::GetFullPath($AppDockDirectory)) 'extensions\Applet.WallpaperSlideshow.at365'
if (-not (Test-Path -LiteralPath (Join-Path $taskDestination 'Applet.WallpaperSlideshow.at365.exe') -PathType Leaf)) { throw 'Deploy the Applet before copying its page assets.' }
$taskWebSource = Join-Path $taskAppletRoot 'Applet.WallpaperSlideshow.at365\web'
foreach ($taskWebAsset in @('history.html', 'history.js', 'history-preferences.js', 'memory-images.js', 'history.css', 'vendor\image-gallery\image-gallery.js', 'vendor\image-gallery\gallery.css', 'vendor\image-gallery\manifest.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $taskWebSource $taskWebAsset) -PathType Leaf)) { throw "Missing page asset: $taskWebAsset" }
}
New-Item -ItemType Directory -Path (Join-Path $taskDestination 'web\vendor\image-gallery') -Force | Out-Null
foreach ($taskWebAsset in @('history.html', 'history.js', 'history-preferences.js', 'memory-images.js', 'history.css', 'vendor\image-gallery\image-gallery.js', 'vendor\image-gallery\gallery.css', 'vendor\image-gallery\manifest.json')) {
    Copy-Item -LiteralPath (Join-Path $taskWebSource $taskWebAsset) -Destination (Join-Path $taskDestination ('web\' + $taskWebAsset)) -Force
}
Write-Output "Page assets deployed: $taskDestination"
