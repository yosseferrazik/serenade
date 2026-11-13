# CHANGES.md

## Qué se ha cambiado

### Reenfoque del producto

- Serenade pasa de “atlas global” a **banco abierto de biodiversidad de Cataluña**, inspirado en el BDBC y claramente independiente de él.
- Nueva marca y textos: “Banc obert de biodiversitat de Catalunya”, catalán por defecto y atribución explícita al BDBC.
- Nueva página de **Fuentes y metodología** (`#/fonts`) con procedencia, licencias, pipeline de ingestión y diagnóstico de la caché.

### Módulos incorporados

| Módulo | Implementación |
| --- | --- |
| Catálogo | `#/`, listado de organismos y especies con paginación. |
| Taxonomía | `#/taxonomia`, navegador jerárquico por reinos, filos, clases, órdenes, familias, géneros y especies. |
| Fichas | `#/taxon/:id`, información individual, linaje, galería, referencias y conservación. |
| Búsqueda | Búsqueda por nombre común y científico con debounce. |
| Filtros | Grupo, rango, orden y **filtro por taxón** (reino, familia, género…). |
| Geografía | **Mapa SVG de registros** en Territorio y en la ficha, con provincias, puntos por grupo y leyenda. |
| Fuentes | Registro de iNaturalist, Wikipedia, GBIF, IUCN, Catalogue of Life, EOL y BDBC. |
| Ingestión | Pipeline en tiempo real, normalización, caché de 10 min y diagnóstico con refresco. |

### Cambios técnicos

- `src/lib/catalonia-map.js`: contornos provinciales y proyección, generados por `scripts/build-catalonia-map.mjs` desde un GeoJSON público.
- `src/components/OccurrenceMap.svelte`: mapa SVG reutilizable con puntos, provincia y leyenda.
- `src/components/TaxonFilter.svelte`: autocompletado para filtrar por cualquier taxón.
- `src/lib/sources.js`: registro de fuentes y pasos del pipeline.
- `src/pages/Taxonomy.svelte`, `src/pages/Sources.svelte`: nuevas vistas.
- `src/lib/api.js`: `searchTaxonFilter`, `getTaxonChildren`, `getRecentObservations`, `getCacheInfo` y `clearCache`.
- `src/lib/store.svelte.js`: estado `taxon` para el filtro por taxón.
- i18n: 301 claves por diccionario (es/ca/en), con paridad verificada.
- Cabecera responsive en dos filas para móvil, con Catálogo, Territorio, Taxonomía y tema.

## Pros

- Cubre los ocho módulos solicitados con funcionalidad real, no solo secciones informativas.
- Responde a las dos preguntas básicas de un banco de biodiversidad: dónde está una especie y qué especies hay en un lugar.
- Reutiliza la arquitectura existente (iNaturalist, caché, i18n, Gencat) sin backend ni dependencias nuevas.
- Añade geografía y taxonomía sin librerías de mapas ni teselas externas.
- Hace explícita la procedencia y el estado de la ingestión, con transparencia sobre límites y licencias.
- Interfaz coherente, accesible y trilingüe, con estados de carga/error en todos los módulos.

## Contras

- Dependencia total de la API pública de iNaturalist: latencia, límites y cambios de esquema.
- Más peticiones: Territorio ronda 15 la primera vez y la ficha hasta 7; se mitiga con caché de 10 min y paralelización.
- El mapa muestra 200 registros recientes de calidad de investigación, no un inventario exhaustivo.
- La distribución sigue siendo provincial, no por comarca, UTM o espacio protegido.
- `threatened` es estado global IUCN, no protección legal catalana; `introduced` no equivale a invasora.
- La taxonomía se limita a 100 hijos directos por nivel.
- El filtro por taxón y el filtro de grupo se excluyen mutuamente para evitar intersecciones ambiguas.

## Puntos a tener en cuenta

- `place_id`: Cataluña 61614; Barcelona 30022; Girona 30023; Lleida 30024; Tarragona 30025.
- Los contornos provinciales son una simplificación para visualización; atribuidos a `click_that_hood` en Fuentes y README.
- La caché es en memoria y se pierde al recargar; la página de Fuentes permite vaciarla o refrescar.
- El idioma por defecto es catalán; se respeta el navegador si es español o inglés.
- Antes de presentar cifras como oficiales, integrar el BDBC y distinguir claramente ambas fuentes.
- Próximos pasos: comarcas y espacios protegidos, mapas por UTM, listas legales catalanas revisadas por expertos y exportación de fichas/listas.
