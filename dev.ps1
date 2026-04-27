# Automation script for building and running CalcPro
Write-Host "--- Building UI ---" -ForegroundColor Cyan
Set-Location ui
npm run build
Set-Location ..

Write-Host "--- Building C++ ---" -ForegroundColor Cyan
cmake --build build --config Release

if ($LASTEXITCODE -eq 0) {
    Write-Host "--- Running CalcPro ---" -ForegroundColor Green
    .\build\bin\Release\app.exe
} else {
    Write-Host "--- Build Failed! ---" -ForegroundColor Red
}
