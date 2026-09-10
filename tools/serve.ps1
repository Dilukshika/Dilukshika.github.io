# Minimal static file server over a raw TcpListener (no URL ACL needed, so it
# runs without admin rights and without installing anything).
#
# Concurrent by design: browsers open several sockets at once and routinely
# open one and send nothing on it (speculative preconnect). A single-threaded
# loop blocks on the first such socket and the page appears to hang, so every
# connection is handled on a runspace pool with a read timeout.
#
# Port 8090, not the usual 8080: AgentService already listens on 8080 on this
# machine, and requests to it hang rather than failing cleanly.

param(
  [string]$Root = (Get-Location).Path,
  [int]$Port = 8090,
  [int]$MaxThreads = 24
)

$types = @{
  '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'
  '.js'='text/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8'
  '.svg'='image/svg+xml'; '.pdf'='application/pdf'; '.png'='image/png'
  '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'
  '.woff2'='font/woff2'; '.woff'='font/woff'; '.ico'='image/x-icon'
  '.webmanifest'='application/manifest+json'; '.xml'='application/xml'
  '.txt'='text/plain; charset=utf-8'; '.map'='application/json'
}

$handler = {
  param($client, $Root, $types)

  try {
    $client.ReceiveTimeout = 5000
    $client.SendTimeout    = 15000
    $client.NoDelay        = $true

    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)

    # Request line. A preconnect socket that never sends one trips the
    # ReceiveTimeout, throws, and only costs this one worker.
    $line = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($line)) { return }

    # Drain the headers so the client is not left mid-write.
    while ($true) {
      $h = $reader.ReadLine()
      if ($null -eq $h -or $h -eq '') { break }
    }

    $parts  = $line -split ' '
    $method = $parts[0]
    $path   = [System.Uri]::UnescapeDataString(($parts[1] -split '\?')[0])
    if ($path -eq '/') { $path = '/index.html' }

    # Keep the request inside the served root.
    $rel  = ($path.TrimStart('/') -replace '/', '\')
    $file = [System.IO.Path]::GetFullPath((Join-Path $Root $rel))
    $safe = $file.StartsWith([System.IO.Path]::GetFullPath($Root), 'OrdinalIgnoreCase')

    if ($safe -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes  = [System.IO.File]::ReadAllBytes($file)
      $ext    = [System.IO.Path]::GetExtension($file).ToLower()
      $ct     = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $status = '200 OK'
    } else {
      $bytes  = [System.Text.Encoding]::UTF8.GetBytes("404 - $path not found")
      $ct     = 'text/plain; charset=utf-8'
      $status = '404 Not Found'
    }

    $head = "HTTP/1.1 $status`r`n" +
            "Content-Type: $ct`r`n" +
            "Content-Length: $($bytes.Length)`r`n" +
            "Cache-Control: no-store`r`n" +
            "Connection: close`r`n`r`n"

    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    if ($method -ne 'HEAD') { $stream.Write($bytes, 0, $bytes.Length) }
    $stream.Flush()
  }
  catch { }
  finally { try { $client.Close() } catch { } }
}

$Root = [System.IO.Path]::GetFullPath($Root)

$pool = [runspacefactory]::CreateRunspacePool(1, $MaxThreads)
$pool.Open()

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host "serving $Root"
Write-Host "  -> http://localhost:$Port/   (Ctrl+C to stop)"

$running = New-Object System.Collections.ArrayList

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()

    $ps = [powershell]::Create()
    $ps.RunspacePool = $pool
    [void]$ps.AddScript($handler.ToString()).AddArgument($client).AddArgument($Root).AddArgument($types)
    [void]$running.Add(@{ ps = $ps; handle = $ps.BeginInvoke() })

    # Reap finished workers so the list does not grow without bound.
    if ($running.Count -gt $MaxThreads) {
      for ($i = $running.Count - 1; $i -ge 0; $i--) {
        if ($running[$i].handle.IsCompleted) {
          try { $running[$i].ps.EndInvoke($running[$i].handle) } catch { }
          $running[$i].ps.Dispose()
          $running.RemoveAt($i)
        }
      }
    }
  }
}
finally {
  $listener.Stop()
  $pool.Close()
  $pool.Dispose()
}
