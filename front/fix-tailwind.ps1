$ErrorActionPreference = "Stop"

Write-Host "==> Backup de la carpeta front..." -ForegroundColor Cyan
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$zip = "..\front_backup_$ts.zip"
Compress-Archive -Path .\* -DestinationPath $zip -Force
Write-Host "✔ Backup creado en $zip"

# 1) Eliminar carpeta duplicada si existe (por seguridad)
$dupPath = ".\front src"
if (Test-Path $dupPath) {
  Write-Host "==> Eliminando carpeta duplicada: $dupPath" -ForegroundColor Yellow
  Remove-Item -Recurse -Force $dupPath
} else {
  Write-Host "• No se encontró carpeta física 'front src'. Si la ves en VSCode, quítala del workspace (no del disco)."
}

# 2) Instalar Tailwind y dependencias
Write-Host "==> Instalando Tailwind + PostCSS..." -ForegroundColor Cyan
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3) Configurar Tailwind (formato CommonJS para CRA)
$tailwindCfg = @"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
"@
Set-Content -Path "tailwind.config.js" -Value $tailwindCfg -Encoding UTF8
Write-Host "✔ tailwind.config.js configurado"

# 4) Configurar PostCSS
$postcssCfg = @"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
"@
Set-Content -Path "postcss.config.js" -Value $postcssCfg -Encoding UTF8
Write-Host "✔ postcss.config.js configurado"

# 5) Crear estilos base Tailwind
if (!(Test-Path "src\styles")) { New-Item -ItemType Directory -Path "src\styles" | Out-Null }
$twCss = @"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@
Set-Content -Path "src\styles\tw.css" -Value $twCss -Encoding UTF8
Write-Host "✔ src/styles/tw.css creado"

# 6) Insertar import en entry (index.js / index.jsx / index.tsx)
$entries = @("src\index.js","src\index.jsx","src\index.tsx") | Where-Object { Test-Path $_ }

if ($entries.Count -eq 0) {
  Write-Host "⚠ No se encontró src/index.(js|jsx|tsx). Verifica el nombre de tu entry file." -ForegroundColor Yellow
} else {
  foreach ($e in $entries) {
    $txt = Get-Content $e -Raw
    if ($txt -notmatch "import './styles/tw.css';") {
      "import './styles/tw.css';`r`n$txt" | Set-Content -Path $e -Encoding UTF8
      Write-Host "✔ Import añadido a $e"
    } else {
      Write-Host "• Import ya presente en $e"
    }
  }
}

Write-Host "`n✅ Tailwind configurado en React (CRA). Ahora ejecuta: npm start" -ForegroundColor Green
