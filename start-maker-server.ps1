$port = 8010
while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
  $port++
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $root "maker-server.log"
$err = Join-Path $root "maker-server.err.log"

$process = Start-Process `
  -FilePath python `
  -ArgumentList @("-m", "http.server", "$port", "--bind", "127.0.0.1") `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $log `
  -RedirectStandardError $err `
  -PassThru

Start-Sleep -Milliseconds 800

if ($process.HasExited) {
  Write-Output "FAILED pid=$($process.Id) exit=$($process.ExitCode)"
  if (Test-Path $err) {
    Get-Content $err -Tail 20
  }
  exit 1
}

Write-Output "STARTED pid=$($process.Id) url=http://127.0.0.1:$port/maker.html"
