# Job Tracker AR

Extensión de Chrome para tracking de postulaciones laborales en Argentina.

Soporta: Indeed, Computrabajo, Bumeran, ZonaJobs, LinkedIn, Empleos IT.

## Instalación

1. Abrí `chrome://extensions/`
2. Activá **Modo desarrollador** (esquina superior derecha)
3. Clickeá **Cargar descomprimida**
4. Seleccioná esta carpeta
5. La extensión aparece como **Job Tracker AR**

## Uso

1. Navegá a una oferta laboral en cualquiera de los portales soportados
2. Clickeá el ícono JT en la barra de extensiones
3. Completá los campos (portal, empresa y URL se detectan automáticamente)
4. Guardá la postulación
5. Para ver todas las postulaciones, clickeá **Ver Dashboard**

## Estructura

```
├── manifest.json          Configuración de la extensión
├── README.md
├── icons/
│   └── icon.png           Ícono placeholder
├── styles/
│   └── styles.css         Estilos compartidos
├── popup/
│   ├── popup.html         Formulario rápido de carga
│   └── popup.js           Lógica del popup + draft persistence
├── dashboard/
│   ├── dashboard.html     Panel completo con tabla y filtros
│   └── dashboard.js       Lógica del dashboard
└── scripts/
    └── content.js         Detección de portal y empresa
```

## Stack

- Chrome Extension Manifest V3
- Sin dependencias externas
- Almacenamiento local: `chrome.storage.local`
