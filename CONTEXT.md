# CONTEXT.md — Serenade y el Banc de Dades de Biodiversitat de Catalunya

## 1. Qué es Serenade

Serenade es una aplicación web estática (SPA) para consultar biodiversidad. Antes de este cambio era un catálogo global de taxones con fichas técnicas, fotos, linaje, subtaxones y referencias, alimentado por la API pública de iNaturalist. La interfaz estaba en español, con temas claro/oscuro y un lenguaje visual inspirado en la Generalitat de Catalunya.

La nueva lectura del producto lo convierte en un **banco abierto de biodiversidad de Cataluña**, inspirado en el BDBC pero independiente de él. El catálogo global se conserva; se añade una capa territorial catalana que responde a las dos preguntas clásicas de un banco de datos: **dónde está una especie** y **qué especies hay en un lugar**.

## 2. Qué es el BDBC

El Banc de Dades de Biodiversitat de Catalunya (BDBC) es el portal de referencia de la biodiversidad catalana. Nació de un convenio entre la Generalitat y la Universitat de Barcelona y recopila citas de especies en Cataluña junto con información taxonómica, biológica, ecológica y bibliográfica. Sus objetivos son:

- **Conocimiento**: inventario de especies, distribución territorial, estado de conservación, rareza y endemicidad.
- **Gestión**: consultas aplicadas a planificación y conservación.
- **Divulgación**: publicación de datos, textos e imágenes para todos los públicos.

El BDBC se organiza en módulos taxonómicos y ofrece consultas básicas (dónde está una especie, qué especies hay en un lugar) y avanzadas (distribución potencial). Su escala es de decenas de miles de especies y combina trabajo de campo, bibliografía, herbarios y colaboradores. Es una fuente oficial, revisada y con registros históricos.

## 3. Replanteamiento del concepto

Serenade no puede ni debe sustituir al BDBC. La propuesta es una **relectura abierta, actual y territorial** del mismo problema:

| Dimensión | BDBC | Serenade |
| --- | --- | --- |
| Fuente | Citas oficiales, bibliografía, herbarios | Observaciones públicas de iNaturalist |
| Actualización | Procesos y revisiones institucionales | Datos vivos, caché de 10 minutos |
| Unidad | Cataluña, UTM, municipios, hábitats | Cataluña y sus cuatro provincias |
| Pregunta | Dónde y qué especie | Dónde, qué especie y cuándo |
| Conservación | Catálogos legales y grados de amenaza | Estado IUCN global y especies introducidas de iNaturalist |
| Acceso | Portal institucional | SPA abierta, sin backend, ca/es/en |
| Límite | Datos oficiales | Datos derivados, no oficiales |

Principios adoptados:

1. **Territorio primero**: Cataluña y sus provincias son la unidad de navegación y de agregación.
2. **Trazabilidad**: la interfaz dice explícitamente que las cifras son de iNaturalist y que el BDBC es inspiración, no fuente copiada.
3. **Datos abiertos y vivos**: cada cifra se calcula bajo demanda y enlaza a la ficha del taxón.
4. **Dos preguntas básicas**: distribución de una especie y especies de un territorio.
5. **Contexto de conservación**: amenazadas e introducidas como lectura complementaria, sin equipararlas a catálogos legales.
6. **Català com a llengua de referència**, con español e inglés.

## 4. Arquitectura actual

- **Svelte 5 + Vite 8**, JavaScript y CSS nativos, sin backend ni router externo.
- Rutas por hash: `#/`, `#/territori`, `#/taxonomia`, `#/fonts`, `#/taxon/:id`.
- Estado del catálogo en `src/lib/store.svelte.js`; estado de idioma en `src/lib/i18n.svelte.js`.
- Datos en `src/lib/api.js`, con normalización, caché en memoria de 10 minutos y `AbortController`.
- Catálogo de lugares en `src/lib/territory.js`: Cataluña (`place_id` 61614) y Barcelona, Girona, Lleida y Tarragona (30022–30025).
- Contornos provinciales y proyección en `src/lib/catalonia-map.js`, generados por `scripts/build-catalonia-map.mjs`.
- Registro de fuentes y pipeline en `src/lib/sources.js`.
- Diseño Gencat: Open Sans, paneles blancos, gris `#ececec`, rojo `#c00000`, radios 2–4 px, sin gradientes.

### Flujo de datos

1. El catálogo usa `/taxa/autocomplete` (búsqueda) o `/taxa` (navegación por grupo y rango).
2. La ficha usa `/taxa/:id` para el detalle.
3. El territorio usa `/observations` (totales), `/observations/species_counts` (especies, amenazadas, introducidas) y `/observations/histogram` (fenología).
4. El mapa usa `/observations` con `geo=true` y `quality_grade=research` para obtener coordenadas.
5. La taxonomía usa `/taxa?parent_id=…` para recorrer hijos directos.
6. Todas las peticiones incluyen `locale` para que iNaturalist devuelva nombres comunes en el idioma activo.

## 5. Módulos añadidos

### 5.1 Territorio (`#/territori`)

- Resumen de Cataluña: observaciones, especies, especies amenazadas y especies introducidas.
- Tarjetas de Cataluña y de las cuatro provincias; al seleccionar una se recargan sus especies más observadas.
- **Mapa de registros de presencia** con contornos provinciales, puntos coloreados por grupo taxonómico, filtro por grupo y leyenda.
- Listas de especies amenazadas (`threatened=true`) y exóticas (`introduced=true`), con enlace a su ficha.
- Nota de datos y enlace al BDBC y a la página de fuentes.

### 5.2 Distribución y fenología en la ficha

- Total de observaciones del taxón en Cataluña.
- Barras por provincia con recuento de observaciones.
- Histograma mensual de observaciones (`month_of_year`), etiquetas de mes localizadas con `Intl`.
- **Mapa de presencia** con hasta 200 registros georreferenciados de calidad de investigación.
- Estados de carga, vacío y error independientes del resto de la ficha.

### 5.3 Navegación y marca

- Nuevas entradas “Territori” y “Taxonomía” en la cabecera.
- Marca y textos orientados a Cataluña (“banc obert”, no “atlas”).
- Llamada a la acción desde el catálogo al territorio.
- Pie con atribución explícita al BDBC y enlace a la página de fuentes.

### 5.4 Idiomas

- Catalán por defecto; español e inglés disponibles.
- 301 claves por diccionario, paridad verificada.
- El cambio de idioma recarga catálogo y ficha para actualizar nombres comunes y resúmenes.
- Números, meses y enlaces a Wikipedia se adaptan al idioma.

### 5.5 Taxonomía (`#/taxonomia`)

- Navegador jerárquico sobre `/taxa?parent_id=…`: reinos, filos, clases, órdenes, familias, géneros y especies.
- Migas de pan con pila de navegación local; cada nodo permite descender o abrir su ficha.
- Muestra hasta 100 hijos directos ordenados por número de observaciones.

### 5.6 Mapa de registros

- SVG propio con contornos de las cuatro provincias, generados desde un GeoJSON público y simplificados.
- Proyección equirectangular con corrección por latitud; puntos coloreados por grupo taxonómico y enlazados a la ficha.
- En Territorio: hasta 200 registros recientes de calidad de investigación, filtrables por grupo.
- En la ficha: hasta 200 registros del taxón en Cataluña.
- Sin librería de mapas, sin teselas externas y sin claves.

### 5.7 Filtro por taxón

- Autocompletado sobre `/taxa/autocomplete` que permite filtrar el catálogo por cualquier taxón: reino, filo, clase, orden, familia, género o especie.
- Al seleccionar un taxón se limpia el filtro de grupo para evitar intersecciones ambiguas.
- El filtro se refleja en el estado del catálogo y participa en la detección de resultados obsoletos.

### 5.8 Fuentes e ingestión (`#/fonts`)

- Registro de fuentes: iNaturalist, Wikipedia, GBIF, IUCN, Catalogue of Life, Encyclopedia of Life y BDBC.
- Pipeline explicado en cuatro pasos: consulta, normalización, caché y visualización.
- Diagnóstico en vivo: idioma, entradas de caché, TTL, última consulta, peticiones recientes y acciones para vaciar o refrescar.
- La ingestión es en tiempo real y en el navegador; no hay backend ni copia persistente.

## 6. Decisiones y supuestos

- **Provincias, no comarcas**: la API de iNaturalist ofrece `place_id` estables para las cuatro provincias; las comarcas exigirían geometrías o identificadores adicionales y más peticiones.
- **Mapa SVG propio**: se evita una librería de mapas y las teselas externas; los contornos provinciales se generan una vez desde un GeoJSON público y se simplifican para el bundle.
- **Muestra de 200 registros**: el mapa prioriza legibilidad y coste de red; no pretende ser exhaustivo.
- **Agregación en cliente**: no se almacenan datos; cada visita consulta iNaturalist y cachea 10 minutos.
- **`threatened` e `introduced`**: se usan los filtros de iNaturalist y se etiquetan con precisión; no se afirma que sean catálogos legales catalanes.
- **Catalán por defecto**: coherencia con el territorio y con la inspiración institucional; se respeta el idioma del navegador si es es/en.

## 7. Riesgos y limitaciones

- Dependencia total de la API pública de iNaturalist (límite de peticiones, cambios de esquema, cobertura desigual).
- Los datos de iNaturalist son observaciones ciudadanas; no equivalen a citas validadas del BDBC.
- Los totales por provincia no siempre suman el total catalán.
- `threatened` refleja el estado global, no la protección legal autonómica.
- El mapa solo muestra 200 registros recientes de calidad de investigación; el esfuerzo de observación está sesgado espacial y temporalmente.
- Los contornos provinciales son una simplificación cartográfica, no una fuente oficial.
- `introduced` no distingue especies invasoras de simples exóticas.
- La distribución por provincia es gruesa; no sustituye una cuadrícula UTM.
- La fenología depende del esfuerzo de observación y puede estar sesgada.

## 8. Próximos pasos posibles

- Añadir comarcas y espacios naturales protegidos con `place_id` o geometrías propias.
- Integrar la descarga o consulta de citas del BDBC/GBIF cuando exista una API estable.
- Añadir mapas por cuadrícula UTM, agrupación de puntos y series temporales.
- Incorporar listas legales catalanas de especies protegidas e invasoras con revisión experta.
- Exportar fichas y listas territoriales en CSV/PDF.
- Convertir la ingestión en un snapshot de build opcional para arrancar sin red.
