# Togglely SDK Debug Tool (PowerShell)
# Usage: .\test-sdk.ps1 -BackendUrl "http://localhost:4000" -ApiKey "togglely_demo_key" -Project "demo-project" -Environment "development" -Flag "test-flag"

param(
    [string]$BackendUrl = "http://localhost:4000",
    [string]$ApiKey = "togglely_demo_key",
    [string]$Project = "demo-project",
    [string]$Environment = "development",
    [string]$Flag = "test-flag"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Togglely SDK Debug Tool" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Backend URL: $BackendUrl"
Write-Host "  API Key: $($ApiKey.Substring(0, [Math]::Min(10, $ApiKey.Length)))..."
Write-Host "  Project: $Project"
Write-Host "  Environment: $Environment"
Write-Host "  Flag: $Flag`n"

function Test-Endpoint {
    param($Url, $Description)
    
    Write-Host "`n--- Testing: $Description ---" -ForegroundColor Yellow
    Write-Host "URL: $Url"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($data | ConvertTo-Json -Depth 3)"
        
        return @{ Success = $true; Data = $data; Status = $response.StatusCode }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            Write-Host "Response: $($body | ConvertTo-Json)" -ForegroundColor Red
            return @{ Success = $false; Data = $body; Status = $statusCode }
        }
        catch {
            Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

# Run tests
$health = Test-Endpoint -Url "$BackendUrl/health" -Description "Health Check"
$single = Test-Endpoint -Url "$BackendUrl/sdk/flags/$Project/$Environment/$Flag`?apiKey=$ApiKey" -Description "Single Flag (with API Key)"
$all = Test-Endpoint -Url "$BackendUrl/sdk/flags/$Project/$Environment`?apiKey=$ApiKey" -Description "All Flags (with API Key)"
$noKey = Test-Endpoint -Url "$BackendUrl/sdk/flags/$Project/$Environment/$Flag" -Description "Single Flag (NO API Key - should fail with 401)"
$wrongKey = Test-Endpoint -Url "$BackendUrl/sdk/flags/$Project/$Environment/$Flag`?apiKey=wrong_key_123" -Description "Single Flag (WRONG API Key - should fail with 401)"

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($single.Success) {
    Write-Host "✅ Single Flag: WORKING" -ForegroundColor Green
    Write-Host "   Enabled: $($single.Data.enabled)"
    Write-Host "   Value: $($single.Data.value)"
    Write-Host "   Type: $($single.Data.flagType)"
} else {
    Write-Host "❌ Single Flag: FAILED" -ForegroundColor Red
    if ($single.Data.code) {
        Write-Host "   Error Code: $($single.Data.code)"
    }
    if ($single.Data.error) {
        Write-Host "   Error: $($single.Data.error)"
    }
}

if ($all.Success) {
    $flagCount = ($all.Data.PSObject.Properties | Measure-Object).Count
    Write-Host "`n✅ All Flags: WORKING ($flagCount flags found)" -ForegroundColor Green
} else {
    Write-Host "`n❌ All Flags: FAILED" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TROUBLESHOOTING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not $single.Success) {
    switch ($single.Data.code) {
        "MISSING_API_KEY" {
            Write-Host "🔑 API Key is missing! Check your SDK configuration." -ForegroundColor Yellow
        }
        "INVALID_API_KEY" {
            Write-Host "🔑 API Key is invalid! Check the key in Togglely Dashboard." -ForegroundColor Yellow
            Write-Host "   Make sure:" -ForegroundColor Gray
            Write-Host "   - The key is active" -ForegroundColor Gray
            Write-Host "   - The key belongs to the correct organization" -ForegroundColor Gray
            Write-Host "   - The project key matches" -ForegroundColor Gray
        }
        "ORIGIN_NOT_ALLOWED" {
            Write-Host "🌐 Origin not allowed! Add your domain to Project Settings > Allowed Origins." -ForegroundColor Yellow
        }
        "PROJECT_NOT_FOUND" {
            Write-Host "📁 Project not found! Check the project key." -ForegroundColor Yellow
        }
        "ENV_NOT_FOUND" {
            Write-Host "🌍 Environment not found! Check the environment key." -ForegroundColor Yellow
        }
        default {
            Write-Host "❓ Unknown error. Check the backend logs for details." -ForegroundColor Yellow
        }
    }
} elseif ($single.Data.enabled -eq $false) {
    Write-Host "⚠️  Flag is DISABLED. Check in Dashboard:" -ForegroundColor Yellow
    Write-Host "   1. Go to your project" -ForegroundColor Gray
    Write-Host "   2. Select the environment" -ForegroundColor Gray
    Write-Host "   3. Enable the flag" -ForegroundColor Gray
    Write-Host "" -ForegroundColor Gray
    Write-Host "   OR the flag might not exist yet (auto-created as disabled)." -ForegroundColor Gray
} else {
    Write-Host "✅ Everything is working correctly!" -ForegroundColor Green
}

Write-Host ""
