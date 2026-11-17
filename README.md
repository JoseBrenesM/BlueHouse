# Blue House Real Estate

Página de Blue House Real Estate (Yoses Sur, Curridabat, Costa Rica): recorrido por una casa al hacer scroll y, debajo, servicios, propiedades, construcción, empresa, asesores, contacto y preguntas frecuentes.

Sitio estático: HTML, CSS y JavaScript sin paso de compilación.

## Estructura

```
index.html          contenido de la página
css/estilos.css     estilos
js/main.js          menú, encabezado, pestañas, intro y recorrido (GSAP + ScrollTrigger + Lenis)
img/                fotos del recorrido y de los asesores (WebP)
video/              recorrido.mp4 (escritorio) y recorrido-movil.mp4 (celular)
fuentes/            Caviar Dreams (WOFF2)
vercel.json         caché de imágenes, video y fuentes
```

GSAP 3.13, ScrollTrigger y Lenis 1.3.4 se cargan desde jsDelivr; Source Serif 4, desde Google Fonts.

El video se elige según la forma de la pantalla (vertical u horizontal). Con ahorro de datos activo, la página muestra solo las fotos del recorrido.

## Ver en local

El video se carga con `fetch`, así que conviene abrir la página con un servidor y no con doble clic:

```bash
python -m http.server 8000
```

Después, abrir http://localhost:8000

## Desplegar en Vercel

1. En Vercel, **Add New → Project** e importar este repositorio.
2. Framework Preset: **Other**. Sin comando de build. Root Directory: la raíz del repo.
3. Deploy. Cada push a `main` vuelve a publicar.

Para el dominio propio: **Settings → Domains** en el proyecto de Vercel.

## Pendiente de contenido

- Las fotos de la sección de propiedades son de ejemplo ([Unsplash](https://unsplash.com)) y se muestran como tales. Reemplazarlas por fotos reales de cada propiedad.

Hecha por [BRN Solutions](https://brnsolution.vercel.app).
