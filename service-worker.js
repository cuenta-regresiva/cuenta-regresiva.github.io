
const CACHE_NAME = "cuenta-regresiva-v2";

const ARCHIVOS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.all(
          ARCHIVOS.map(async (archivo) => {
            try {
              await cache.add(archivo);
            } catch (error) {
              console.warn(
                "No se pudo guardar en caché:",
                archivo,
                error
              );
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter(
              (nombre) =>
                nombre.startsWith("cuenta-regresiva-") &&
                nombre !== CACHE_NAME
            )
            .map((nombre) => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();

          caches.open(CACHE_NAME)
            .then((cache) =>
              cache.put(event.request, copia)
            )
            .catch(() => {});
        }

        return respuesta;
      })
      .catch(async () => {
        const guardado = await caches.match(event.request);

        if (guardado) return guardado;

        if (event.request.mode === "navigate") {
          return (
            await caches.match("/")
          ) || new Response(
            "Sin conexión. Volvé a conectarte para abrir el contador.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        }

        return new Response("Sin conexión", {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      })
  );
});
