# DearMenu E2E Test Script
$ErrorActionPreference = "Continue"

$BASE_URL = "http://localhost:8000"
$FRONTEND_URL = "http://localhost:3000"

$testResults = @()

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    $url = "$BASE_URL$Endpoint"
    $result = @{
        Name = $Name
        Method = $Method
        URL = $url
        Success = $false
        StatusCode = 0
        Response = $null
        Error = $null
    }

    try {
        $params = @{
            Uri = $url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Compress
        }

        $response = Invoke-RestMethod @params -TimeoutSec 10
        $result.Response = $response
        $result.Success = $true
        $result.StatusCode = 200
    }
    catch {
        $result.Error = $_.Exception.Message
        if ($_.Exception.Response) {
            $result.StatusCode = [int]$_.Exception.Response.StatusCode
        }
    }

    $testResults += $result
    $status = if ($result.Success) { "PASS" } else { "FAIL" }
    Write-Host "[$status] $Name" -ForegroundColor $(if ($result.Success) { "Green" } else { "Red" })
    if ($result.Error) {
        Write-Host "  Error: $($result.Error)" -ForegroundColor Yellow
    }
    return $result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DearMenu v2.2 E2E Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Service Health Check
Write-Host "1. Service Health Check" -ForegroundColor Yellow
Write-Host "-" * 40

try {
    $frontendStatus = (Invoke-WebRequest -Uri $FRONTEND_URL -TimeoutSec 5 -UseBasicParsing).StatusCode
    Write-Host "[PASS] Frontend accessible ($frontendStatus)" -ForegroundColor Green
    $testResults += @{ Name = "Frontend Health"; Success = $true; StatusCode = $frontendStatus }
} catch {
    Write-Host "[FAIL] Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Name = "Frontend Health"; Success = $false; Error = $_.Exception.Message }
}

try {
    $backendStatus = (Invoke-WebRequest -Uri "$BASE_URL/docs" -TimeoutSec 5 -UseBasicParsing).StatusCode
    Write-Host "[PASS] Backend accessible ($backendStatus)" -ForegroundColor Green
    $testResults += @{ Name = "Backend Health"; Success = $true; StatusCode = $backendStatus }
} catch {
    Write-Host "[FAIL] Backend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Name = "Backend Health"; Success = $false; Error = $_.Exception.Message }
}
Write-Host ""

# 2. Authentication Tests
Write-Host "2. Authentication Tests" -ForegroundColor Yellow
Write-Host "-" * 40

$loginBody = @{
    username = "wife003"
    password = "123456"
}

$loginResult = Test-API -Name "Login API" -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody

$token = ""
if ($loginResult.Success -and $loginResult.Response.access_token) {
    $token = $loginResult.Response.access_token
    Write-Host "  Token obtained: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Gray
}

$authHeaders = @{
    "Authorization" = "Bearer $token"
}

# 3. Category API Tests
Write-Host ""
Write-Host "3. Category API Tests" -ForegroundColor Yellow
Write-Host "-" * 40

$categoriesResult = Test-API -Name "Get Categories" -Method "GET" -Endpoint "/api/categories" -Headers $authHeaders
$categoryId = $null
if ($categoriesResult.Success -and $categoriesResult.Response) {
    $cats = $categoriesResult.Response
    Write-Host "  Found $($cats.Count) categories" -ForegroundColor Gray
    if ($cats.Count -gt 0) {
        $categoryId = $cats[0].id
        Write-Host "  First category: $($cats[0].name)" -ForegroundColor Gray
    }
}

# 4. Dishes API Tests
Write-Host ""
Write-Host "4. Dishes API Tests" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Dishes" -Method "GET" -Endpoint "/api/dishes" -Headers $authHeaders

$dishId = $null
if ($categoryId) {
    $newDishBody = @{
        name = "Test Dish E2E"
        category_id = $categoryId
        price = 25.5
        notes = "E2E test dish"
    }
    $newDish = Test-API -Name "Create Dish" -Method "POST" -Endpoint "/api/dishes" -Headers $authHeaders -Body $newDishBody

    if ($newDish.Success -and $newDish.Response.id) {
        $dishId = $newDish.Response.id

        Test-API -Name "Get Single Dish" -Method "GET" -Endpoint "/api/dishes/$dishId" -Headers $authHeaders

        $updateDishBody = @{
            name = "Test Dish E2E Updated"
            price = 30.0
        }
        Test-API -Name "Update Dish" -Method "PUT" -Endpoint "/api/dishes/$dishId" -Headers $authHeaders -Body $updateDishBody
    }
}

# 5. Favorites API Tests
Write-Host ""
Write-Host "5. Favorites API Tests" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Favorites" -Method "GET" -Endpoint "/api/favorites" -Headers $authHeaders

if ($dishId) {
    $favBody = @{ dish_id = $dishId }
    Test-API -Name "Add to Favorites" -Method "POST" -Endpoint "/api/favorites" -Headers $authHeaders -Body $favBody
}

# 6. History API Tests
Write-Host ""
Write-Host "6. History API Tests" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get History" -Method "GET" -Endpoint "/api/history" -Headers $authHeaders

if ($dishId) {
    $histBody = @{ dish_id = $dishId }
    Test-API -Name "Add to History" -Method "POST" -Endpoint "/api/history" -Headers $authHeaders -Body $histBody
}

# 7. Random API Tests
Write-Host ""
Write-Host "7. Random Recommendation API Tests" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Random Dish" -Method "GET" -Endpoint "/api/random" -Headers $authHeaders
Test-API -Name "Get Smart Recommendation" -Method "GET" -Endpoint "/api/recommendations/smart" -Headers $authHeaders

# 8. Notifications API Tests (New in v2.2)
Write-Host ""
Write-Host "8. Notifications API Tests (v2.2)" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Notifications" -Method "GET" -Endpoint "/api/notifications" -Headers $authHeaders

$notifBody = @{
    type = "task"
    title = "E2E Test Notification"
    content = "This is a test notification from E2E"
}
Test-API -Name "Create Notification" -Method "POST" -Endpoint "/api/notifications" -Headers $authHeaders -Body $notifBody

# 9. Messages API Tests (New in v2.2)
Write-Host ""
Write-Host "9. Messages API Tests (v2.2)" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Conversations" -Method "GET" -Endpoint "/api/messages/conversations" -Headers $authHeaders

$msgBody = @{
    receiver_id = "system"
    content = "E2E Test Message"
}
Test-API -Name "Send Message" -Method "POST" -Endpoint "/api/messages" -Headers $authHeaders -Body $msgBody

# 10. Stats API Tests (New in v2.2)
Write-Host ""
Write-Host "10. Stats API Tests (v2.2)" -ForegroundColor Yellow
Write-Host "-" * 40

Test-API -Name "Get Dashboard Stats" -Method "GET" -Endpoint "/api/stats/dashboard" -Headers $authHeaders
Test-API -Name "Get Popular Dishes" -Method "GET" -Endpoint "/api/stats/popular" -Headers $authHeaders
Test-API -Name "Get Category Stats" -Method "GET" -Endpoint "/api/stats/categories" -Headers $authHeaders
Test-API -Name "Get Trend Data" -Method "GET" -Endpoint "/api/stats/trends" -Headers $authHeaders

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { -not $_.Success } | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "E2E Test Complete!" -ForegroundColor Cyan
