# Imágenes a generar — prompts para DALL·E

No tengo generación de imágenes conectada en este chat, así que aquí tienes los prompts listos para pegar en DALL·E (ChatGPT), Midjourney o el generador de tu preferencia. Todos están calibrados sobre la paleta del sistema de diseño ya definido en `tailwind.config.ts`:

- **Ink** (base): `#0B0E14` → `#F8F9FB` (azul-tinta casi negro a blanco)
- **Amber** (único acento): `#B4680A` → `#F5C377`
- **Success:** `#2F9E67` · **Danger:** `#D64545`

Regla general para todos los prompts: **fondo oscuro ink (#0B0E14 o #12161F), un solo acento ámbar cálido, minimalista, sin gradientes cliché morado/rosa, sin ilustraciones genéricas de "startup flotando con laptop".**

---

## 1. Logotipo / isotipo

```
Minimalist geometric logomark for a B2B SaaS product called "FreelanceHub",
a single abstract symbol combining a folder tab and an upward arrow into
one continuous shape, flat vector, single warm amber color (#D6820F) on
a transparent background, no gradients, no 3D, no drop shadows, clean
geometric construction like Linear or Vercel's logo, works at 16px favicon
size, square canvas, extremely simple, 2-3 line strokes maximum.
```

Variante en texto (wordmark):
```
Clean modern wordmark logo reading "FreelanceHub", geometric sans-serif
typeface similar to Inter or GT America, tight letter spacing, single
warm amber color (#D6820F), on transparent background, flat vector,
no effects, minimal and confident, small case with the H slightly bolder.
```

## 2. Favicon / icono de app (iOS y Android)

```
App icon for a business management app, rounded square with 22% corner
radius (iOS style), dark ink background (#12161F), centered minimalist
amber (#D6820F) geometric symbol combining a checkmark and a document
corner fold, flat design, no text, no gradient, high contrast, looks
crisp at 40x40px, square 1024x1024 canvas.
```

## 3. Ilustración de onboarding — "Crea tu primer cliente"

```
Minimalist flat vector illustration for an empty state screen, dark navy
background (#0B0E14), a single simple line-art folder icon with a plus
sign, warm amber accent color (#D6820F) only, no people, no gradients,
no clutter, generous negative space, geometric and confident like Linear
or Notion's empty-state illustrations, subtle dotted grid pattern in the
background at low opacity.
```

## 4. Ilustración de onboarding — "Sin proyectos activos"

```
Minimalist flat vector illustration, dark navy background (#0B0E14),
simple line-art kanban board icon with three columns, one card floating
slightly above the board, warm amber accent (#D6820F), no people, no
gradients, clean geometric shapes, plenty of negative space, subtle grid
texture, style consistent with Linear/Vercel empty states.
```

## 5. Ilustración de onboarding — "Sin facturas todavía"

```
Minimalist flat vector illustration, dark navy background (#0B0E14),
simple line-art invoice/receipt icon with a checkmark badge, warm amber
accent (#D6820F), no people, no gradients, geometric and clean, generous
negative space, subtle dotted grid background at low opacity.
```

## 6. Imagen Open Graph / social share (1200x630)

```
Wide banner 1200x630px, dark ink background (#0B0E14) with a subtle
diagonal grid pattern at 5% opacity, large bold wordmark "FreelanceHub"
in white centered-left, small amber (#D6820F) geometric logomark to its
left, tagline below in smaller gray text "CRM, proyectos y facturación
en un solo lugar", generous margins, flat design, no gradients, no stock
photography, no people, professional SaaS aesthetic like Linear's OG
images.
```

## 7. Portada del portal de cliente (vista que ve el cliente final al pagar)

```
Minimalist hero graphic for a client-facing payment page, dark ink
background (#12161F), abstract geometric composition of overlapping thin
amber (#D6820F) line strokes forming a subtle document/invoice shape,
very restrained, mostly negative space, no text, no people, professional
and trustworthy, style consistent with Stripe Checkout's minimal aesthetic.
```

## 8. Ilustración de error 404 / algo salió mal

```
Minimalist flat vector illustration, dark navy background (#0B0E14),
simple line-art broken document icon with a small crack, muted red
accent (#D64545) used sparingly alongside amber (#D6820F), no people,
no gradients, calm and non-alarming tone, generous negative space.
```

## 9. Assets de app store (opcional, para cuando publiques en iOS/Android vía Antigravity/Cursor)

```
App store screenshot background template, dark ink gradient from
#0B0E14 to #12161F, subtle geometric grid pattern, empty phone mockup
placeholder area centered, amber (#D6820F) accent shapes in the corners
only, portrait 1290x2796px (iPhone) canvas, minimal and premium, space
reserved at top for a headline in white bold sans-serif.
```

---

## Cómo usarlos

1. Genera cada imagen en DALL·E (o tu herramienta preferida) con el prompt correspondiente.
2. Para el logotipo y favicon, pide siempre **fondo transparente** y exporta a SVG si tu herramienta lo permite (o vectoriza el PNG después con un servicio como vectorizer.ai).
3. Guarda los assets en `public/` del proyecto: `public/logo.svg`, `public/favicon.ico`, `public/og-image.png`, `public/illustrations/*.svg`.
4. Los tamaños de ícono de app (iOS/Android) los puedes generar automáticamente a partir del icono 1024x1024 con una herramienta como [appicon.co](https://appicon.co) — no necesitas pedirle a DALL·E cada resolución por separado.
