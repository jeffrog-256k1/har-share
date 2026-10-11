# HAR Share

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

Reconstruye un archivo de red mínimo antes de compartir un HAR. El nuevo archivo excluye cabeceras, cookies, cuerpos, nombres y valores de consulta, direcciones originales y extensiones.

[Probar](https://jeffrog-256k1.github.io/har-share/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![HAR Share](assets/preview.png)

## Ejecutar localmente

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/har-share.git
cd har-share
npm ci
npm run build
npm run dev
# Open the local URL printed by Vite.
```

Elige o arrastra un HAR 1.2 UTF-8, o carga el ejemplo ficticio. Revisa los contadores y la cascada antes de exportar HAR reducido o HTML independiente. Las descargas tienen nombres fijos. Vaciar elimina el resultado actual; no se guarda automáticamente. UI y documentos en cinco idiomas.

## Cómo funciona

Se construyen desde cero método HTTP permitido, estado, MIME, tamaños de respuesta, fases temporales y orden. Hosts y rutas reciben alias estables example.invalid, conservando relaciones entre recursos. Se eliminan consultas y fragmentos. Fechas: 2000-01-01 más el desplazamiento relativo original. No se conservan títulos, IP, ID de conexión, destino de redirección, cabeceras, cookies, cuerpos, extensiones ni nombre original.

Se permiten GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT y TRACE; otros son OTHER. Lista MIME en src/core.ts: desconocidos pasan a application/octet-stream y se eliminan parámetros. Versión HTTP: marcador HTTP/1.1; texto de estado vacío; tamaños de cabeceras y cuerpo de solicitud -1. La duración se recalcula sin duplicar SSL incluido en connect. La diferencia entre campos de entrada/salida no cuenta secretos eliminados.

## Alcance y límites

Límites: 10 MiB, HAR 1.2, 1–2.000 entradas HTTP(S), intervalo de fechas ≤7 días, fases y duración total ≤24 horas, tamaños ≤1 TB. Números finitos; tamaños y estados enteros. send/wait/receive no negativos, fases opcionales admiten -1. Se rechazan datos obligatorios ausentes, URL data:, WebSocket y formatos o codificaciones no compatibles. Límite de proceso: 10 segundos. Sin ZIP.

Orden, tamaños, estados, tiempos y relaciones siguen siendo información. Revisa antes de compartir: no se garantiza anonimato. Sin cuerpos no se reproducen solicitudes ni se analizan problemas del contenido. Se valida el esquema HAR 1.2 y la importación de Playwright, no todos los visores externos. El HTML incluye todas las entradas; la UI pagina de 50 en 50.

## Desarrollo

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
