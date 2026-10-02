$json = Get-Content "node_modules\esbuild\package.json" -Raw | ConvertFrom-Json
$json.scripts.postinstall = "echo skipped"
$json | ConvertTo-Json | Set-Content "node_modules\esbuild\package.json"
Write-Host "Modified esbuild postinstall"
