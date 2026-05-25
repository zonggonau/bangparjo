$c = [System.IO.File]::ReadAllText('src/lib/blog-templates.ts')
$c = $c.Replace("'&': '&'", "'&': '&'")
[System.IO.File]::WriteAllText('src/lib/blog-templates.ts', $c)
Write-Host 'Fixed!'
