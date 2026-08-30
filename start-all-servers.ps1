$baseDir = "C:\Users\admin\OneDrive\Documents\PazorPay HACK"

# Kill any existing node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Starting RTO Firewall servers..." -ForegroundColor Green

# Start Risk Engine (port 8787)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", "Set-Location '$baseDir\risk-engine'; Write-Host 'Risk Engine starting on port 8787...' -ForegroundColor Cyan; node node_modules/wrangler/bin/wrangler.js dev --port 8787"
) -WindowStyle Minimized
Write-Host "  [1/3] Risk Engine: http://localhost:8787" -ForegroundColor Yellow

Start-Sleep -Seconds 10

# Start Dashboard (port 5173)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", "Set-Location '$baseDir\dashboard'; Write-Host 'Dashboard starting on port 5173...' -ForegroundColor Cyan; npx vite --port 5173"
) -WindowStyle Minimized
Write-Host "  [2/3] Dashboard: http://localhost:5173" -ForegroundColor Yellow

Start-Sleep -Seconds 5

# Start Demo Page (port 3000)
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command", "Set-Location '$baseDir\demo'; Write-Host 'Demo Page starting on port 3000...' -ForegroundColor Cyan; npx serve -l 3000"
) -WindowStyle Minimized
Write-Host "  [3/3] Demo Page: http://localhost:3000" -ForegroundColor Yellow

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "All servers started!" -ForegroundColor Green
Write-Host "  Engine:   http://localhost:8787" -ForegroundColor White
Write-Host "  Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  Demo:     http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
