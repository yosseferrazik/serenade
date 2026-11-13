# Serenade

Banco abierto de biodiversidad de Cataluña, inspirado en el Banc de Dades de Biodiversitat de Catalunya (BDBC). Catálogo de taxones, distribución territorial y fenología con datos públicos de iNaturalist. Svelte 5 + Vite, sin backend. Interfaz en catalán, español e inglés.

Es un proyecto independiente: no es un servicio oficial ni sustituye los registros del BDBC.

## Stack

- Svelte 5 con runas (`$state`, `$derived`, `$effect`) y Vite 8.
- JavaScript y CSS nativos. Sin router ni librerías de UI.
- Node.js `^20.19.0` o `>=22.12.0`.

## Uso

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/
```

## Concepto

El BDBC es el portal de referencia de la biodiversidad catalana: recopila citas de especies, su distribución, ecología, rareza, endemicidad y grado de amenaza. Serenade reinterpreta ese objetivo con una capa abierta y actual:

- **Territorio primero**: Cataluña y sus cuatro provincias son la unidad de lectura.
- **Datos vivos y citados**: cada cifra enlaza a observaciones públicas de iNaturalist; no se copian registros oficiales.
- **Dos preguntas básicas**: dónde está una especie y qué especies hay en un lugar.
- **Contexto de conservación**: especies amenazadas y especies introducidas conviven con el catálogo.
- **Trazabilidad**: se distingue siempre lo que es dato de iNaturalist de lo que es inspiración conceptual del BDBC.

## Funcionalidad

- **Catálogo (`#/`)**: búsqueda por nombre común o científico (debounce de 320 ms), filtro por taxón (reino, familia, género… mediante autocompletado), filtros por grupo y rango, orden por observaciones o fecha de alta, paginación incremental y estados de carga, vacío y error.
- **Taxonomía (`#/taxonomia`)**: navegación jerárquica por reinos, filos, clases, órdenes, familias, géneros y especies, con migas de pan y enlace a cada ficha.
- **Territorio (`#/territori`)**: resumen de Cataluña (observaciones, especies, amenazadas e introducidas), tarjetas por provincia seleccionables, especies más observadas del territorio elegido, **mapa de registros de presencia** con filtro por grupo y listas de especies amenazadas y exóticas.
- **Ficha (`#/taxon/:id`)**: galería con atribución y licencia, linaje navegable, ficha técnica, resumen de Wikipedia, subtaxones, referencias externas, **distribución por provincia en Cataluña**, **fenología mensual** y **mapa de presencia**.
- **Fuentes (`#/fonts`)**: procedencia de cada dato, licencias, pipeline de ingestión, diagnóstico de la caché en memoria y relación con el BDBC.
- **Interfaz**: tres idiomas con selector persistido, tema claro/oscuro, diseño responsive, navegación por teclado y respeto a `prefers-reduced-motion`.

## Idiomas

La interfaz está disponible en catalán (`ca`), español (`es`) e inglés (`en`). El selector `ES · CA · EN` de la barra superior cambia todos los textos, los nombres comunes que devuelve iNaturalist, el formato de números, los enlaces a Wikipedia y el atributo `lang`. La elección se guarda en `localStorage` (`serenade-locale`); sin preferencia se usa el idioma del navegador y, en su defecto, el catalán.

Los textos viven en `src/lib/messages/{es,ca,en}.js` como diccionarios planos con marcadores `{param}`. `src/lib/i18n.svelte.js` expone `i18n.locale`, `setLocale()` y `t(clave, params)`. Para añadir un idioma basta con crear el diccionario, registrarlo en `messages` y añadirlo a `LOCALES`.

## Diseño

La interfaz sigue el lenguaje visual de la Generalitat de Catalunya (ver `.opencode/skills/gencat-web-style`): estética institucional plana, Open Sans, paneles blancos sobre gris `#ececec`, rojo `#c00000` como único acento fuerte y geometría rectangular de 2–4 px. El tema claro es el predeterminado. La marca es un cuadrado de la senyera con cuatro barras y el nombre en minúsculas; el mismo símbolo se usa como favicon.

## API

Base: `https://api.inaturalist.org/v1`. Pública, con CORS y sin autenticación.

| Endpoint | Uso |
| --- | --- |
| `GET /taxa/autocomplete` | Búsqueda por texto, ordenada por relevancia. |
| `GET /taxa` | Navegación por grupo y rango con `page` y `per_page`. |
| `GET /taxa?parent_id` | Hijos directos para el navegador taxonómico. |
| `GET /taxa/:id` | Detalle: ancestros, hijos, fotos, resumen y conservación. |
| `GET /observations` | Totales por lugar y taxón; registros georreferenciados para el mapa. |
| `GET /observations/species_counts` | Especies y recuentos por lugar, con filtros `threatened` e `introduced`. |
| `GET /observations/histogram` | Fenología mensual (`month_of_year`) por lugar y taxón. |

`src/lib/api.js` centraliza las peticiones, normaliza la respuesta, aplica una caché en memoria de 10 minutos y propaga `AbortController`. Las fichas se precargan al pasar el cursor sobre una tarjeta.

## Rutas

| Ruta | Vista |
| --- | --- |
| `#/` | Catálogo |
| `#/territori` | Territorio: Cataluña, provincias y mapa |
| `#/taxonomia` | Navegador taxonómico |
| `#/fonts` | Fuentes, metodología e ingestión |
| `#/taxon/:id` | Ficha del taxón |

El router por hash (`src/lib/router.svelte.js`) no necesita configuración del servidor.

## Estructura

```text
src/
├── App.svelte                 # Rutas, cabecera, pie y scroll
├── app.css                    # Tokens, temas y estilos base
├── main.js
├── components/
│   ├── Filters.svelte         # Búsqueda, grupo, rango y orden
│   ├── Header.svelte          # Marca, idioma y tema
│   ├── Icon.svelte            # Iconos SVG inline
│   ├── Logo.svelte            # Marca senyera y logotipo
│   ├── OccurrenceMap.svelte   # Mapa SVG de registros
│   ├── SpeciesRow.svelte      # Fila compacta de especie
│   ├── TaxonCard.svelte       # Tarjeta del catálogo
│   └── TaxonFilter.svelte     # Autocompletado de reino/familia/género
├── lib/
│   ├── api.js                 # Cliente iNaturalist, normalización y caché
│   ├── catalonia-map.js       # Contornos provinciales y proyección (generado)
│   ├── i18n.svelte.js         # Estado de idioma, detección y traducción
│   ├── messages/              # Diccionarios es, ca y en
│   ├── router.svelte.js       # Router por hash
│   ├── sources.js             # Registro de fuentes y pipeline
│   ├── store.svelte.js        # Estado del catálogo
│   ├── territory.js           # Places de iNaturalist y enlace al BDBC
│   └── utils.js               # Grupos, rangos, IUCN y formateo
└── pages/
    ├── Catalog.svelte         # Catálogo y paginación
    ├── Sources.svelte         # Fuentes e ingestión
    ├── Taxonomy.svelte        # Navegador taxonómico
    ├── Territory.svelte       # Resumen territorial, listas y mapa
    └── TaxonDetail.svelte     # Ficha, distribución, fenología y mapa

scripts/
└── build-catalonia-map.mjs    # Genera los contornos desde GeoJSON
```

## Rendimiento

- El estado del catálogo vive en un módulo, así que filtros y resultados se conservan al volver desde una ficha.
- `AbortController` cancela la carga anterior; el debounce agrupa los cambios de filtro.
- En la ficha, la distribución y la fenología se piden en paralelo y se cachean 10 minutos.
- El mapa usa hasta 200 registros de calidad de investigación por consulta.
- Imágenes con `loading="lazy"` y `decoding="async"`; `preconnect` a los CDN de iNaturalist.
- Build de producción: ≈177 KB de JS y ≈59 KB de CSS (≈53 KB y ≈9.4 KB gzip).

## Límites

- Todas las cifras son observaciones públicas de iNaturalist, no citas validadas del BDBC.
- `threatened` sigue el estado global de iNaturalist/IUCN; no equivale al catálogo legal catalán de especies protegidas.
- `introduced` indica especies introducidas según iNaturalist; no todas son invasoras.
- Los totales por provincia pueden no sumar el total de Cataluña: hay citas sin provincia asignada o en aguas limítrofes.
- El mapa muestra como máximo 200 registros recientes de calidad de investigación; no es un inventario exhaustivo.
- Los contornos provinciales son una simplificación cartográfica para visualización, no una fuente oficial.
- `/taxa` solo ordena por `id`, `created_at` u `observations_count`; no hay orden alfabético.
- `/taxa/autocomplete` no pagina: devuelve hasta 30 resultados.

## Atribución

- Datos y fotografías: [iNaturalist](https://www.inaturalist.org). Resúmenes: [Wikipedia](https://www.wikipedia.org).
- Referencias: [GBIF](https://www.gbif.org), [Catalogue of Life](https://www.catalogueoflife.org), [Encyclopedia of Life](https://eol.org) e [IUCN Red List](https://www.iucnredlist.org).
- Inspiración conceptual: [Banc de Dades de Biodiversitat de Catalunya](https://mediambient.gencat.cat/ca/05_ambits_dactuacio/patrimoni_natural/sistemes_dinformacio/banc_de_dades_de_biodiversitat).
- Contornos provinciales del mapa: GeoJSON público de provincias de [click_that_hood](https://github.com/codeforgermany/click_that_hood).
