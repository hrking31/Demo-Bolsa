# 📈 Demo Bolsa

Aplicación web para consultar cotizaciones y gráficos de acciones de EE. UU. (IBM, Apple, Microsoft y Alphabet), construida con **React**, **Tailwind CSS** y **Chart.js**, consumiendo la API REST de **Twelve Data**.

🔗 **[Ver la demo en vivo](https://demobolsa-31.web.app/)**

## ✨ Funcionalidades

- **Lista de acciones** con precio actual, variación frente al cierre anterior y mini gráfico de los últimos 30 días (SVG propio, animado).
- **Gráfico detallado** de la acción elegida, con dos periodos: intradía cada 5 minutos o último mes. Incluye tooltip, línea guía que sigue al cursor, relleno degradado y máximo, mínimo y cierre anterior.
- **Estado del mercado** de Nueva York (abierto o cerrado) calculado con la zona horaria `America/New_York`.
- **Diseño responsive** y accesible: navegación por teclado, foco visible, contraste AA y animaciones que respetan la preferencia del sistema de reducir movimiento.

## 🧠 Decisiones técnicas sobre la API

El plan gratuito de Twelve Data permite 8 consultas por minuto y 800 al día. La app está pensada para no agotarlas y para no mostrar nunca una pantalla rota:

| Problema | Solución |
|---|---|
| Consultas repetidas al recargar | Las respuestas se guardan en `localStorage` con tiempo de expiración (1 h para datos diarios, 10 min para intradía). |
| Dos componentes piden lo mismo a la vez | Las solicitudes en curso se comparten: una sola llamada HTTP por símbolo e intervalo. |
| Respuestas lentas que llegan tarde | El hook solo acepta respuestas que coinciden con el símbolo e intervalo actuales. |
| Límite alcanzado, clave inválida o sin red | Mensaje claro y botón **Reintentar**. Se muestra la última copia guardada o, si no hay, datos de ejemplo con una etiqueta visible. |
| Twelve Data responde errores con HTTP 200 | Se revisan `status` y `code` del cuerpo de la respuesta, no solo el código HTTP. |

Al cargar, la app hace 5 consultas: 4 series diarias (una por acción) y 1 intradía. El periodo "1 mes" reutiliza los datos diarios ya descargados.

## 🛠 Tecnologías

React 19, Vite, Tailwind CSS 4, Chart.js 4 con react-chartjs-2, Fetch API y Firebase Hosting.

## 🚀 Cómo ejecutarla

Requisitos: Node.js 18 o superior y una clave gratuita de [Twelve Data](https://twelvedata.com/).

```bash
git clone https://github.com/hrking31/Demo-Bolsa.git
cd demo-bolsa
npm install
cp .env.example .env.local   # luego pega tu clave en .env.local
npm run dev
```

Abre http://localhost:5173. Sin clave, la app funciona igual con datos de ejemplo.

## ☁️ Despliegue en Firebase Hosting

```bash
npm run build      # usa la clave de .env.local
firebase deploy
```

> La clave queda incluida en el código que descarga el navegador, algo habitual en demos con claves gratuitas. En producción, las llamadas deberían pasar por un servidor intermedio (por ejemplo, una Cloud Function) que guarde la clave.

## 📁 Estructura

```plaintext
src/
├── App.jsx                       # Página: encabezado, lista y gráfico
├── services/
│   ├── twelveData.js             # Llamadas a la API, caché y manejo de errores
│   └── sampleData.js             # Datos de ejemplo cuando la API no está disponible
├── hooks/
│   ├── useTimeSeries.js          # Carga de datos con reintento y control de respuestas viejas
│   └── useAnimatedNumber.js      # Animación del precio
├── Components/
│   ├── StockCard/                # Fila de la lista con precio y mini gráfico
│   ├── StockChart/               # Gráfico detallado
│   ├── Sparkline/                # Mini gráfico en SVG
│   ├── MarketStatus/             # Mercado abierto o cerrado
│   └── SourceBadge/              # Aviso de datos guardados o de ejemplo
└── utils/                        # Formatos de precio y fecha, horario del mercado
```

## 🔜 Próximos pasos

- Precios en vivo con el WebSocket de Finnhub.
- Buscador de acciones.
- Pruebas automáticas (Vitest) de la capa de API, incluidos los errores.
- Servidor intermedio para ocultar la clave.

## 📄 Licencia

MIT.

Desarrollado por **Hernando Rey**. Contacto: hrking31@gmail.com
