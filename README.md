# Local Media Studio

Aplicación web local para redimensionar imágenes y videos, visualizar archivos en una galería y buscar por filtros sin subir contenido a la nube.

## Características

- Procesado 100% local en el navegador.
- Redimensionado de imágenes con calidad configurable.
- Redimensionado de videos usando canvas y MediaRecorder.
- Galería con búsqueda avanzada por nombre, tipo y dimensiones.
- Reproducción local de videos e inspección de imágenes.
- Sin uso de servicios externos ni almacenamiento en la nube.

## Requisitos

- Node.js 18+
- Un navegador moderno con soporte para `canvas`, `MediaRecorder` y `URL.createObjectURL`.

## Instalación

```bash
npm install
```

## Ejecutar en modo desarrollo

```bash
npm run dev
```

## Construcción de producción

```bash
npm run build
```

## Nota de privacidad

Todos los archivos se procesan dentro del navegador del usuario y no se suben a servidores externos. La aplicación no usa backend ni APIs externas para el tratamiento de contenido.
