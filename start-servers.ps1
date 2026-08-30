Write-Output "Starting RTO Firewall servers..."
Write-Output ""

# Start Risk Engine
Write-Output "[1/2] Starting Risk Engine on port 8787..."
$riskEngine = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"C:\Users\admin\OneDrive\Documents\PazorPay HACK\risk-engine`" && npx wrangler dev --port 8787" -PassThru -WindowStyle Hidden
Write-Output "  PID: $($riskEngine.Id)"

# Start Dashboard
Write-Output "[2/2] Starting Dashboard on port 5173..."
$dashboard = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"C:\Users\admin\OneDrive\Documents\PazorPay HACK\dashboard`" && npx vite --port 5173" -PassThru -WindowStyle Hidden
Write-Output "  PID: $($dashboard.Id)"

Write-Output ""
Write-Output "Servers starting..."
Write-Output "  Risk Engine: http://localhost:8787"
Write-Output "  Dashboard:   http://localhost:5173"
Write-Output ""
Write-Output "Waiting 15 seconds for startup..."
Start-Sleep -Seconds 15

Write-Output ""
Write-Output "=== Checking ports ==="
$port8787 = netstat -ano | findstr ":8787" | findstr "LISTEN"
$port5173 = netstat -ano | findstr ":5173" | findstr "LISTEN"

if ($port8787) {
    Write-Output "  [OK] Risk Engine is listening on port 8787"
} else {
    Write-Output "  [!!] Risk Engine NOT listening on port 8787"
}

if ($port5173) {
    Write-Output "  [OK] Dashboard is listening on port 5173"
} else {
    Write-Output "  [!!] Dashboard NOT listening on port 5173"
}

Write-Output ""
Write-Output "To test risk engine:"
Write-Output '  Invoke-RestMethod -Uri "http://localhost:8787/api/health" -Method GET'
Write-Output ""
Write-Output "To stop servers:"
Write-Output "  Stop-Process -Id $($riskEngine.Id) -ErrorAction SilentlyContinue"
Write-Output "  Stop-Process -Id $($dashboard.Id) -ErrorAction SilentlyContinue"
