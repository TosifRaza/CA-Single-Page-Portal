$ErrorActionPreference = 'Stop'

$mysqlBase = Join-Path $env:ProgramFiles 'MySQL\MySQL Server 8.0'
$mysqld = Join-Path $mysqlBase 'bin\mysqld.exe'
$mysqlClient = Join-Path $mysqlBase 'bin\mysql.exe'
$serverRoot = Split-Path $PSScriptRoot -Parent
$mysqlData = Join-Path $serverRoot 'mysql_data'
$logPath = Join-Path $serverRoot 'mysql-local.log'
$pidPath = Join-Path $serverRoot 'mysql-local.pid'

if (!(Test-Path $mysqld) -or !(Test-Path $mysqlClient)) {
  throw 'MySQL Server 8.0 is not installed in Program Files.'
}

if (!(Test-Path (Join-Path $mysqlData 'auto.cnf'))) {
  $existingFiles = @(Get-ChildItem -LiteralPath $mysqlData -Force -ErrorAction SilentlyContinue)
  if ($existingFiles.Count -gt 0) {
    throw "The local MySQL data directory is not initialized: $mysqlData"
  }
  New-Item -ItemType Directory -Path $mysqlData -Force | Out-Null
  & $mysqld --no-defaults --initialize-insecure "--basedir=$mysqlBase" "--datadir=$mysqlData" --console
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not initialize the local MySQL data directory.'
  }
}

$tcp = [System.Net.Sockets.TcpClient]::new()
try {
  $connect = $tcp.BeginConnect('127.0.0.1', 3307, $null, $null)
  $alreadyRunning = $connect.AsyncWaitHandle.WaitOne(300) -and $tcp.Connected
} finally {
  $tcp.Dispose()
}

if (!$alreadyRunning) {
  $arguments = @(
    '--no-defaults',
    "--basedir=`"$mysqlBase`"",
    "--datadir=`"$mysqlData`"",
    '--port=3307',
    '--bind-address=127.0.0.1',
    '--mysqlx=0',
    "--log-error=`"$logPath`"",
    "--pid-file=`"$pidPath`""
  )
  $process = Start-Process -FilePath $mysqld -ArgumentList $arguments -WindowStyle Hidden -PassThru

  for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 500
    $tcp = [System.Net.Sockets.TcpClient]::new()
    try {
      $connect = $tcp.BeginConnect('127.0.0.1', 3307, $null, $null)
      if ($connect.AsyncWaitHandle.WaitOne(300) -and $tcp.Connected) { break }
    } finally {
      $tcp.Dispose()
    }
    if ($process.HasExited) {
      throw "Local MySQL stopped during startup. Check $logPath"
    }
  }
}

& $mysqlClient --protocol=tcp --host=127.0.0.1 --port=3307 --user=root --execute="CREATE DATABASE IF NOT EXISTS ca_proflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) {
  throw 'Could not create ca_proflow. Check local MySQL startup and port 3307.'
}

Write-Output 'Local MySQL is ready at 127.0.0.1:3307/ca_proflow.'
