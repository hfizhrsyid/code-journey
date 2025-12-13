$baseUrl = "http://localhost:8000/api"

Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
Write-Host "Testing New Database-First Endpoints" -ForegroundColor Cyan
Write-Host "$('=' * 60)`n" -ForegroundColor Cyan

# 1. Test GET /api/topics/
Write-Host "[1] Testing GET /api/topics/ (no auth required)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/topics/" -Method GET -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Topics found: $($data.count)"
    foreach ($topic in $data.topics | Select-Object -First 3) {
        Write-Host "  - $($topic.name): $($topic.question_count) questions"
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "$('=' * 60)`n" -ForegroundColor Cyan
