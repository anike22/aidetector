# Theme Name: Editorial

# Vibe & Description: Magazine-like editorial design that prioritizes refined typesetting and a professional information hierarchy. Oversized headlines, elegant font layering, and generous whitespace create a strong reading rhythm. Content is structured with magazine-inspired grids and card layouts, anchored by high-contrast black-and-white tones and elevated with a restrained accent color. Delicate dividers, subtle shadows, and understated transitions add premium polish and improve readability.

# Color
- Primary: #2563EB (hsl(221 83% 53%))
- On Primary: #FFFFFF
- Accent: #0F172A (hsl(222 47% 11%))
- On Accent: #FFFFFF
- Background: #FFFFFF
- Foreground: #0F172A
- Muted: #F1F5F9
- Muted Foreground: #64748B
- Border: #E2E8F0
- Card: #FFFFFF
- Dark Background: #0F172A
- Dark Foreground: #F8FAFC
- Dark Primary: #3B82F6
- Dark Accent: #F8FAFC

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --accent: 222 47% 11%;
  --accent-foreground: 0 0% 100%;
  --ring: 221 83% 53% / 0.25;
  --radius: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.06);
  --shadow-md: 0 10px 30px rgba(0,0,0,.10);
  --tracking-tight: -0.02em;
  --leading-body: 1.7;
}
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 14%;
  --card-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --accent: 210 40% 98%;
  --accent-foreground: 222 47% 11%;
  --ring: 217 91% 60% / 0.25;
  --radius: 12px;
}

# Font
- Heading: Playfair Display (family: 'Playfair Display', serif; url: https://resource-static.cdn.bcebos.com/fonts/Playfair_Display.woff2)
- Body: Inter (family: 'Inter', system-ui, sans-serif; use next/font/google)
# Animation
## Element Animation
- Buttons slowly lift on hover (ease-out);
- Images slowly zoom within their container on hover, rather than changing abruptly.
## Transition Animation
- When scrolling down, create a relaxed, unhurried scrolling experience. Elements fade in and float upward as they enter the viewport.

# Layout
- Prefer asymmetry within structure: allow certain modules (hero image, quote block) to break the grid for editorial impact.
- Use a magazine-like grid as the backbone: clean alignment and generous whitespace.

# Elements
- Masthead / Header: magazine title, issue-style navigation, subtle separators;
- Cover Hero: oversized headline, deck (lead paragraph), author/date/reading time metadata.



