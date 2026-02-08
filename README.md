# Krtček – spuštění lokálního serveru

Prohlížeč blokuje načítání lokálních assetů kvůli CORS, pokud otevřete `index.html` přes `file://` (Origin: null). Spusťte jednoduchý lokální HTTP server a otevřete hru přes `http://localhost:8000`.

Dostupné způsoby (v kořenovém adresáři projektu):

- Windows (dvojklikem spustit):
  - `start-server.bat` – spustí Python HTTP server nebo (pokud Python není) použije `npx http-server`.
- PowerShell:
  - `start-server.ps1` – stejná logika, run PowerShell a spusťte skript.
- Ručně v terminálu:
  - Python 3:
    ```bash
    py -3 -m http.server 8000
    ```
    nebo
    ```bash
    python -m http.server 8000
    ```
  - Node (npx):
    ```bash
    npx http-server -p 8000
    ```

Otevřete v prohlížeči:

http://localhost:8000

Pokud používáte VS Code, nejjednodušší je rozšíření Live Server (klikněte `Go Live`).

Bezpečnostní poznámka: Nespouštějte prohlížeč s vypnutou ochranou (např. `--disable-web-security`) kromě dočasného debugu – není to bezpečné.
