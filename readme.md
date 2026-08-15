# Atribuidor Wikiproyecto LGBT+

Este _script_ es de uso en la Wikipedia en español (eswiki), y tiene como objetivo permitir la atribución de un artículo al Wikiproyecto LGBT+ de forma sencilla. Para ello realiza las siguientes acciones por la persona usuaria:

1. Añade la plantilla {{pr|LBGT}} a la página de discusión del artículo.
2. Añade el artículo a la lista de artículos creados del Wikiproyecto LGBT+
3. Actualiza el contador de artículos creados.

## Interfaz

El _script_ utiliza [`mw.notify()`](https://doc.wikimedia.org/mediawiki-core/master/js/mw.html#.notify), la biblioteca de notificaciones del núcleo de MediaWiki (módulo `mediawiki.notification`), para toda su interfaz:

- Una notificación flotante persistente informa a la persona usuaria de las acciones que el _script_ va realizando en cada momento.
- Al finalizar, se muestra una notificación de éxito (o de error, si alguna de las ediciones falla).

Al tratarse de una utilidad del núcleo de MediaWiki, no requiere ninguna biblioteca externa (OOUI, Codex, etc.).

## Desarrollo

El _script_ está escrito en TypeScript y se empaqueta en un único archivo de JavaScript plano (`dist/atribuidor.js`) mediante `npm run build`, que comprueba los tipos con `tsc` y genera el paquete con [esbuild](https://esbuild.github.io/) (`npm run watch` recompila automáticamente al guardar). El tipado de los objetos `mw` y `$` lo proporciona el paquete [`types-mediawiki`](https://www.npmjs.com/package/types-mediawiki).

Estructura del código fuente:

- [`src/atribuidor.ts`](src/atribuidor.ts): punto de entrada y orquestación de las acciones.
- [`src/actions/`](src/actions/): cada acción del _script_ en su propio archivo (`addProjectTemplate.ts`, `addCreatedArticleToList.ts`, `updateArticleCounter.ts`).
- [`src/i18n/translations.ts`](src/i18n/translations.ts): objeto de traducciones con todos los mensajes del _script_.
- [`src/config/links.ts`](src/config/links.ts): títulos de las páginas que edita el _script_.