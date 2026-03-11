# Content upload guide (Hada site)

Je kunt hier zelf teksten en foto's vervangen:

## Pagina's
- Home: `index.html`
- Augusta Hada: `augusta-hada/index.html`
- Pueblo Blanco Hada: `pueblo-blanco-hada/index.html`
- Casita Arenal Hada: `arenal-appartment/index.html`

## Foto's map (aanbevolen)
Plaats nieuwe foto's in:
- `assets/images/augusta/`
- `assets/images/pueblo-blanco/`
- `assets/images/arenal/`

Tip bestandsnamen:
- alleen kleine letters, cijfers en koppeltekens
- voorbeeld: `living-room-01.jpg`

## Hoe foto's koppelen
In de pagina zoek je naar `<img ... src="...">` en vervang je `src` naar jouw bestand.
Voorbeeld:
`src="assets/images/augusta/living-room-01.jpg"`

## WhatsApp nummer
Zoek op:
`https://wa.me/31645182246`
En vervang door jouw nummer als dat nodig is.

## Testen
Open lokaal via:
`http://localhost:8080`
(niet via dubbelklik/file://)
