# Atribuidor Wikiproyecto LGBT+

Este _script_ es de uso en la Wikipedia en español (eswiki), y tiene como objetivo permitir la atribución de un artículo al [Wikiproyecto LGBT+](https://es.wikipedia.org/wiki/Wikiproyecto:LGBT) de forma sencilla. Funciona en los espacios de nombres de artículos y de anexos, y añade junto al título un botón con el logo del Wikiproyecto que, tras pedir confirmación, realiza las siguientes acciones por la persona usuaria:

1. Añade la plantilla `{{PR|LGBT}}` al principio de la página de discusión del artículo (`Discusión:` o `Anexo discusión:`, según corresponda), creándola si no existe. Si la discusión ya contiene la atribución en cualquiera de sus formas (`{{PR}}` o su redirección `{{Pr}}`, con parámetro posicional o `1=`, en cualquier combinación de mayúsculas o junto a otros wikiproyectos), este paso se omite.
2. Añade el artículo a la [lista de artículos creados](https://es.wikipedia.org/wiki/Wikiproyecto:LGBT/Art%C3%ADculos_creados) del Wikiproyecto, dentro del bloque del año en que se creó y en orden cronológico según la fecha de su primera revisión. La misma edición actualiza los contadores de la página: el año correspondiente de la `{{Gráfica de evolución}}` y el total del `{{cuadro}}`.
3. Opcionalmente, y previa confirmación aparte, añade el artículo a la tabla de «Artículos trabajados» del [Evento del mes](https://es.wikipedia.org/wiki/Wikiproyecto:LGBT/Evento_del_mes) en curso. Un formulario recoge el tipo de artículo (nueva creación o traducción) y su elemento de Wikidata (obligatorio; se rellena automáticamente si el artículo ya está conectado), y la fila se genera con la numeración siguiente, el tamaño actual del artículo en bytes y la firma `{{u|…}}` de quien lo atribuye.

Al cargar un artículo, el _script_ comprueba primero si ya figura en la lista de artículos creados: mientras consulta muestra un indicador de carga, y después el botón pasa a ser accionable (`+`) o queda marcado como ya atribuido (`✅`).

## Interfaz

- El botón desencadenante se inserta junto al título del artículo, con el estilo definido en [`src/styles/atribuidor.css`](src/styles/atribuidor.css).
- Una notificación flotante persistente ([`mw.notify()`](https://doc.wikimedia.org/mediawiki-core/master/js/mw.html#.notify), módulo `mediawiki.notification`) informa de las acciones que el _script_ va realizando, y al finalizar se muestra una notificación de éxito (o de error, si alguna de las ediciones falla).
- Las confirmaciones y el formulario del Evento del mes utilizan diálogos de [OOUI](https://www.mediawiki.org/wiki/OOUI) (módulos `oojs-ui-core`, `oojs-ui-windows` y `oojs-ui-widgets`), que se cargan de forma diferida solo cuando se pulsa el botón. Cancelar cualquiera de los diálogos aborta la atribución sin realizar ninguna edición.

Todas las ediciones se realizan con `mw.Api`: las transformaciones de páginas existentes usan `api.edit()`, que detecta conflictos de edición mediante `basetimestamp`, y cada paso comprueba antes el estado real de la página para no duplicar contenido (las repeticiones se resuelven como ediciones nulas).

## Instalación y despliegue

El paquete generado (`dist/atribuidor.js`) se publica en [`Usuario:Nacaru/atribuidor-wikiproyecto-lgbt.js`](https://es.wikipedia.org/wiki/Usuario:Nacaru/atribuidor-wikiproyecto-lgbt.js) y se importa desde la página `common.js` de la persona usuaria con `mw.loader.load()`.

## Desarrollo

El _script_ está escrito en TypeScript y se empaqueta en un único archivo de JavaScript plano (`dist/atribuidor.js`) mediante `npm run build`, que comprueba los tipos con `tsc` y genera el paquete con [esbuild](https://esbuild.github.io/) (`npm run watch` recompila automáticamente al guardar). El tipado de los objetos `mw` y `$` lo proporciona el paquete [`types-mediawiki`](https://www.npmjs.com/package/types-mediawiki), y la hoja de estilos se incrusta en el paquete con el cargador `text` de esbuild.

Estructura del código fuente:

- [`src/atribuidor.ts`](src/atribuidor.ts): punto de entrada, botón desencadenante y orquestación de las acciones.
- [`src/actions/`](src/actions/): cada edición del _script_ en su propio archivo (`addProjectTemplate.ts`, `addCreatedArticleToList.ts`, `addArticleToMonthlyEvent.ts`).
- [`src/queries/`](src/queries/): consultas de solo lectura a la API (contenido de páginas, fecha de creación, tamaño en bytes, pertenencia a la lista).
- [`src/ui/`](src/ui/): diálogos de confirmación y formulario del Evento del mes.
- [`src/utils/`](src/utils/): utilidades puras (fechas en español, título de la página de discusión, detección de enlaces, etc.).
- [`src/i18n/translations.ts`](src/i18n/translations.ts): objeto de traducciones con todos los mensajes del _script_.
- [`src/config/links.ts`](src/config/links.ts): títulos y recursos de las páginas que utiliza el _script_.
- [`src/styles/atribuidor.css`](src/styles/atribuidor.css): estilos del botón desencadenante.
