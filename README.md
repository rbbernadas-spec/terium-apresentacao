# TERIUM — Apresentação Interativa (HTML)

Este pacote foi gerado a partir do seu PDF + mindmap + flashcards.

## Como publicar no GitHub Pages
1. Crie um repositório e faça upload de **tudo** (inclusive as pastas `assets/` e `data/`).
2. No GitHub: **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / folder: **/(root)**
5. Acesse a URL do Pages.

## Observação (abrir localmente)
Alguns navegadores bloqueiam `fetch()` em `file://`.
Para testar localmente, use um servidor simples, por exemplo:
- Python: `python -m http.server 8000`

## Conteúdo
- `data/sections.json` controla a ordem e textos das seções.
- `data/flashcards.json` vem do seu CSV.
- `data/mindmap.json` controla os nós do mindmap.

