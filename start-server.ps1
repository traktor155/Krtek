Write-Host "Starting local HTTP server on port 8000..."

# Try python first
try {
    python -m http.server 8000
} catch {
    try {
        py -3 -m http.server 8000
    } catch {
        Write-Host "Python not found or failed. Trying npx http-server..."
        npx http-server -p 8000 --silent
    }
}

Write-Host "Server stopped. Open http://localhost:8000 in your browser."
