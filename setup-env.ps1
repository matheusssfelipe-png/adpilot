# Script to set up Vercel environment variables without newline issues
$envVars = @{
    "ADMIN_EMAIL" = "matheusssfelipe@gmail.com"
    "ADMIN_PASSWORD" = "652371lmc"
    "JWT_SECRET" = "adpilot-jwt-s3cr3t-k3y-triz0s-2026-x9f7m2"
    "GEMINI_API_KEY" = "AIzaSyAPswEAqytEapqLwmfQKdlLXv5_NYRZikc"
    "META_APP_ID" = "927496953251999"
    "META_APP_SECRET" = "68b98d439e179c02f7aeebd744609fc5"
    "NEXT_PUBLIC_APP_URL" = "https://ads-manager-projeto5.vercel.app"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    $tempFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tempFile, $value)
    Write-Host "Setting $key..."
    Get-Content $tempFile -Raw | npx vercel env add $key production --yes --force
    Remove-Item $tempFile
}

Write-Host "`nAll environment variables set!"
