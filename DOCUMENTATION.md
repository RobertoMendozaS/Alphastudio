# Documentación del Proyecto: Alphastudio

## 1. Daily Check-in y Racha (Streak)

### Descripción
El sistema permite a los usuarios realizar un "check-in" diario para mantener una racha de uso (streak). La racha representa la cantidad de días consecutivos que el usuario ha ingresado a la plataforma y pulsado el botón de check-in.

### Funcionamiento (`ProfileScreen.tsx` y `authService.ts`)
- **Visualización:** En la pantalla de perfil (`ProfileScreen`), se muestra el número actual de la racha junto a un ícono representativo.
- **Botón de Check-in:** Si el usuario no ha realizado su check-in en el día actual, el botón se habilita. Una vez presionado, se registra en la base de datos de Supabase.
- **Cálculo de la Racha (`getStreak`):** La función consulta los últimos 30 check-ins del usuario. Calcula la diferencia de días entre el último check-in y la fecha actual. Si la diferencia es menor o igual a 1, evalúa iterativamente los check-ins anteriores para sumar a la racha mientras la diferencia entre un check-in y su precedente sea exactamente de 1 día.
- **Validación Diaria:** La función `getStreak` ahora retorna un objeto `{ streak: number, checkedInToday: boolean }`. La propiedad `checkedInToday` asegura que el botón de check-in se deshabilite correctamente para el resto del día, incluso si existe una racha acumulada de días previos.

## 2. Edge Function de Groq Proxy

### Descripción
Para proteger la API Key de Groq y gestionar de forma centralizada las peticiones al modelo de IA, se ha implementado una Edge Function en Supabase que funciona como proxy.

### Características Principales (`groq-proxy/index.ts`)
- **Exponential Backoff y Reintentos:** La función incluye lógica para reintentar la petición automáticamente en caso de errores de red, límites de cuota (HTTP 429) o errores del servidor (HTTP 500+). Realiza hasta 3 intentos duplicando el tiempo de espera entre cada uno.
- **Manejo de Errores y Validaciones:** 
  - Manejo de preflight CORS.
  - Validación de método HTTP (solo POST).
  - Verificación de variables de entorno (asegurando que `GROQ_API_KEY` esté configurada).
  - Manejo de parseo JSON (`req.json()`) con bloque `try-catch` para evitar caídas no controladas y devolver HTTP 400 ante cuerpos de petición inválidos.
  - Validación de campos obligatorios como el `prompt`.

### Endpoint
- **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/groq-proxy`
- **Headers Requeridos:** `Content-Type: application/json`
- **Body Requerido:** 
```json
{
  "prompt": "Texto del prompt del usuario",
  "model": "llama-3.1-8b-instant", // Opcional
  "temperature": 0.5 // Opcional
}
```
