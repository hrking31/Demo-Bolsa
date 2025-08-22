# 📈 Demo Bolsa de Valores

Una aplicación web profesional y responsiva para visualizar datos en tiempo real de la bolsa de valores, construida con **React**, **Tailwind CSS**, y **Chart.js**, utilizando la API gratuita de Alpha Vantage. Esta demo muestra habilidades avanzadas en desarrollo frontend, integración de APIs, y visualización de datos interactiva. La aplicación está hospedada en **Firebase Hosting** para un acceso rápido y confiable.

🔗 **[Ver Demo en Firebase Hosting](https://demobolsa-31.web.app/)** 

## ✨ Funcionalidades Principales

- **Visualización de Múltiples Acciones**: Muestra datos en tiempo real para acciones populares como Apple (AAPL), Microsoft (MSFT), Google (GOOGL), e IBM (IBM).
- **Tarjetas Interactivas**:
  - 💰 **Precio Actual**: Muestra el precio más reciente de cada acción usando la API `GLOBAL_QUOTE`.
  - 📈 **Cambio Porcentual**: Colores dinámicos (verde para subidas, rojo para bajadas) para una lectura rápida.
  - 📊 **Mini Gráfico Intradiario**: Visualiza la evolución de precios en intervalos de 5 minutos en un gráfico compacto.
  - 🖱️ **Interactividad Intuitiva**: Toca o haz clic en una tarjeta para ver detalles históricos, con pistas visuales como bordes animados y efectos hover.
- **Gráfico Principal Interactivo**:
  - 📅 Muestra la evolución intradiaria de la acción seleccionada (intervalos de 5 minutos) usando `TIME_SERIES_INTRADAY`.
  - 🛠️ Configuración responsive con Chart.js, optimizada para móviles y escritorios.
  - 🔄 Botón "Actualizar" para recargar datos manualmente, evitando superar los límites de la API.
- **Manejo de Claves de API**:
  - 🔑 Soporte para clave `demo` de Alpha Vantage o una clave personalizada ingresada por el usuario.
  - 🚨 Manejo robusto de errores, como límites de solicitudes (5/min con `demo`, 25/día con clave gratuita).
- **Diseño Moderno y Responsive**:
  - 🎨 Construido con **Tailwind CSS** para un diseño limpio y adaptable.
  - 📱 Optimizado para móviles: tarjetas en cuadrícula de 2 columnas, gráficos con altura dinámica, y tamaños de texto ajustados.
- **Hospedaje en Firebase Hosting**:
  - ☁️ Desplegado en Firebase para un acceso rápido, seguro, y escalable.
- **Accesibilidad**:
  - ♿ Soporte para navegación por teclado en las tarjetas (Enter o Espacio para seleccionar).

## 🛠 Tecnologías Utilizadas

- **React**: Biblioteca frontend para construir interfaces dinámicas.
- **Tailwind CSS**: Framework CSS para un diseño moderno y responsive.
- **Chart.js y react-chartjs-2**: Visualización de gráficos interactivos.
- **Fetch API**: Conexión con la API de Alpha Vantage para datos en tiempo real.
- **Firebase Hosting**: Plataforma de hospedaje para un despliegue rápido y confiable.

## 🚀 Cómo Usar

### Prerrequisitos
- Node.js (versión 18 o superior)
- Una clave de API de [Alpha Vantage](https://www.alphavantage.co/support/#api-key) (puedes usar `demo` para pruebas limitadas)

### Instalación
1. Clona el repositorio:
   ```bash
   git clone <https://github.com/hrking31/Demo-Bolsa.git>
   cd demo-bolsa


2. Instala las dependencias:
   ```bash
   npm install


3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev

4. Abre http://localhost:3000 en tu navegador.

Configuración de la API

Ingresa tu clave de API de Alpha Vantage en el campo correspondiente en la aplicación.
La clave demo está configurada por defecto, pero tiene un límite de 5 solicitudes por minuto.
Para más solicitudes, obtén una clave gratuita o premium en Alpha Vantage.

Despliegue en Firebase Hosting

1. Instala Firebase CLI:
   ```bash
   npm install -g firebase-tools


2. Inicia sesión en Firebase:
   ```bash
   firebase login


3. Inicializa Firebase en el proyecto:
   ```bash
   firebase init hosting


Selecciona tu proyecto de Firebase.
Configura public como la carpeta de despliegue (normalmente build).


4. Construye la aplicación:
   ```bash   
   npm run build


5. Despliega a Firebase Hosting:
   ```bash
   firebase deploy


Accede a la URL proporcionada (por ejemplo, https://your-project-id.web.app).

📋 Estructura del Proyecto
   ```plaintext
   demo-bolsa/
   ├── src/
   │   ├── Components/
   │   │   ├── StockCard/
   │   │   │   └── StockCard.jsx    # Tarjetas con precio, cambio y mini gráfico
   │   │   └── StockChart/
   │   │       └── StockChart.jsx   # Gráfico principal de precios intradiarios
   │   ├── App.jsx                  # Componente principal
   │   ├── index.js                 # Punto de entrada
   │   └── styles.css               # Estilos de Tailwind CSS
   ├── public/
   │   └── index.html               # Plantilla HTML
   ├── package.json                 # Dependencias y scripts
   └── README.md                    # Este archivo
```
🛑 Notas sobre la API

Clave demo: Limitada a 5 solicitudes por minuto. Las 4 tarjetas realizan 8 consultas (2 por tarjeta: GLOBAL_QUOTE y TIME_SERIES_INTRADAY), y el gráfico principal realiza 1. Usa el botón "Actualizar" para evitar superar el límite.
Clave gratuita: Limitada a 25 solicitudes por día (por ejemplo, con la clave 8N2X3670MC5CL7WB). Si ves el mensaje "We have detected your API key as 8N2X3670MC5CL7WB...", espera hasta el próximo día o usa una nueva clave.
Plan Premium: Recomendado para uso intensivo. Visita Alpha Vantage Premium.

📱 Optimización para Móviles

Diseño Responsive:
Tarjetas en cuadrícula de 2 columnas en móviles, 4 en escritorios.
Gráfico principal con altura dinámica (250px en móviles, 400px en escritorios) y maintainAspectRatio: false.
Textos más pequeños en móviles (text-xs, text-sm) para evitar desbordamiento.


Interactividad:
Texto "Toca para ver precios intradiarios" en las tarjetas.
Borde animado (animate-pulse) en la tarjeta seleccionada.
Botones "Actualizar" con tamaño adecuado para toque.


Rendimiento:
Consultas escalonadas con retrasos (1 segundo por tarjeta) para no superar el límite de la API.



🐛 Solución de Problemas

Gráfico no visible en móviles:
Verifica que las dependencias (react-chartjs-2, chart.js) estén instaladas.
Revisa la consola para errores de API (por ejemplo, "Error Message": "Invalid API call").
Asegúrate de que el contenedor del gráfico tenga espacio suficiente.


Límite de API alcanzado:
Usa una nueva clave gratuita o espera hasta que se reinicie el límite.
Reduce las consultas usando el botón "Actualizar" manualmente.


Errores de diseño:
Confirma que Tailwind CSS está configurado correctamente (npm install tailwindcss y styles.css configurado).



🚀 Mejoras Futuras

Agregar más símbolos de acciones dinámicamente.
Implementar almacenamiento en caché para reducir solicitudes a la API.
Añadir filtros para intervalos de tiempo (por ejemplo, 1h, 1d, 1w).
Incorporar temas oscuro/claro para personalización.

📄 Licencia
MIT License. Siéntete libre de usar y modificar este proyecto.
🙌 Contribuciones
¡Las contribuciones son bienvenidas! Abre un issue o un pull request en el repositorio.

Desarrollado con 💻 por Hernando Rey Para comentarios o preguntas, contáctame en hrking31@gmail.com o abre un issue en el repositorio.