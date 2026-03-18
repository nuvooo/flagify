# CORS Test Script for Togglely
# Tests CORS configuration from different "origins"

param(
    [string]$BackendUrl = "https://api.togglely.de",
    [string]$ApiKey = "togglely_demo_key",
    [string]$Project = "demo-project",
    [string]$Environment = "development",
    [string]$Flag = "test-flag",
    [string]$TestOrigin = "https://localhost:3000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORS Test for Togglely" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Backend: $BackendUrl" -ForegroundColor Yellow
Write-Host "Test Origin: $TestOrigin`n" -ForegroundColor Yellow

# Test 1: Simple GET without Origin (should always work)
Write-Host "TEST 1: GET without Origin header (simulates curl/server)" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: GET with Origin header
Write-Host "`nTEST 2: GET with Origin header" -ForegroundColor Green
$headers = @{ "Origin" = $TestOrigin }
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✅ Access-Control-Allow-Origin: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No CORS header in response!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Preflight OPTIONS request
Write-Host "`nTEST 3: OPTIONS Preflight request" -ForegroundColor Green
$headers = @{
    "Origin" = $TestOrigin
    "Access-Control-Request-Method" = "GET"
    "Access-Control-Request-Headers" = "Content-Type"
}
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/sdk/flags/$Project/$Environment/$Flag" `
        -Method OPTIONS -Headers $headers -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor Gray
    $response.Headers | ForEach-Object { 
        if ($_.Key -like "*CORS*" -or $_.Key -like "*Access*") {
            Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "   Status: $status" -ForegroundColor Red
    }
}

# Test 4: Actual SDK request with Origin
Write-Host "`nTEST 4: SDK request with Origin header" -ForegroundColor Green
$headers = @{
    "Origin" = $TestOrigin
    "Content-Type" = "application/json"
}
$url = "$BackendUrl/sdk/flags/$Project/$Environment/$Flag`?apiKey=$ApiKey"
Write-Host "URL: $url" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    $body = $response.Content | ConvertFrom-Json
    Write-Host "Response: $($body | ConvertTo-Json -Depth 2)" -ForegroundColor White
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✅ CORS header present: $corsHeader" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $body = $reader.ReadToEnd()
        Write-Host "Response: $body" -ForegroundColor Red
    }
}

# Test 5: Test with different origins
Write-Host "`nTEST 5: Testing multiple origins" -ForegroundColor Green
$origins = @(
    "http://localhost:3000",
    "http://localhost:5173", 
    "https://app.togglely.de",
    "https://togglely.de",
    "https://evil.com"
)

foreach ($origin in $origins) {
    $headers = @{ "Origin" = $origin }
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -Headers $headers -ErrorAction SilentlyContinue
        $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
        if ($corsHeader) {
            Write-Host "✅ $origin -> Allowed ($corsHeader)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $origin -> No CORS header" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $origin -> Blocked" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Fix Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host @"

If you see CORS errors:

1. In Coolify, set the environment variable:
   CORS_ORIGINS=https://app.yourdomain.de,https://www.yourapp.com

2. Or allow all origins (NOT for production!):
   CORS_ORIGINS=*

3. Redeploy the backend

4. Check the backend logs for:
   [CORS] Configuration:
   [CORS] Parsed origins: ["https://..."]

5. If origin is blocked, you'll see:
   [CORS] BLOCKED origin: https://...

"@ -ForegroundColor White
