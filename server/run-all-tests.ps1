# PowerShell script để chạy tất cả tests
# Sử dụng: .\run-all-tests.ps1

Write-Host "🧪 CHẠY TẤT CẢ BACKEND TESTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Chạy tất cả tests
Write-Host "📦 Đang chạy 60 test cases..." -ForegroundColor Yellow
npm test -- --run --reporter=verbose

Write-Host ""
Write-Host "✅ HOÀN THÀNH!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Để xem coverage report, chạy:" -ForegroundColor Cyan
Write-Host "   npm run test:coverage" -ForegroundColor White
Write-Host ""
