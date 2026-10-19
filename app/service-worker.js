
const CACHE_NAME = "mi-contador-app-v1";

const ARCHIVOS = [
  "/app/",
  "/app/index.html",
  "/app/contador.html",
  "/app/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Instala el servicio y guarda los archivos principales.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

// Activa la nueva versión sin borrar la caché del contador original.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres
          .filter((nombre) =>
            nombre.startsWith("mi-contador-app-") &&
            nombre !== CACHE_NAME
          )
          .map((nombre) => caches.delete(nombre))
      ))
      .then(() => self.clients.claim())
  );
});

// Intenta consultar la red y usa la caché si no hay conexión.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();

          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copia));
        }

        return respuesta;
      })
      .catch(async () => {
        const guardado = await caches.match(event.request);

        if (guardado) return guardado;

        if (event.request.mode === "navigate") {
          return await caches.match("/app/index.html");
        }

        return new Response("Sin conexión", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
