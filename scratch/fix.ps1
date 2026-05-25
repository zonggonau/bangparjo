$content = Get-Content "src/lib/blog-templates.ts" -Raw
$fixed = $content -replace "'&': '&'", "'&': '&'"
Set-Content "src/lib/blog-templates.ts" -Value $fixed -NoNewline
Write-Host "Fixed!"
