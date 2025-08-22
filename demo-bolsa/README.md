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
   git clone <URL_DEL_REPOSITORIO>
   cd demo-bolsa