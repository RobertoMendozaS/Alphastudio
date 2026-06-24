# Design System — AlphaStudio AI

**No modificar colores, fuentes, radios, espaciados, animaciones o patrones sin aprobación explícita.**

---

## 1. Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `bg-deep` | `#09090b` | Inicio de gradiente fondo |
| `bg-primary` | `#0f0b1f` | Fondo pantallas, cards, header, tab bar |
| `bg-secondary` | `#17122b` | Inputs, resource rows, iconos card |
| `bg-tertiary` | `#3b2c6b` | Chips, progress track, skeleton, demo btn |
| `bg-dark` | `#111827` | Check button sin completar |
| `bg-completed` | `#0b1f18` | Card completada |
| `bg-completed-dark` | `#052e16` | Check button completado |
| `accent` | `#8b5cf6` | Botones, badge dot, avatar, check circle |
| `accent-gradient` | `#6366f1` | Secundario gradiente |
| `text-primary` | `#f8fafc` | Texto principal |
| `text-muted` | `#a78bfa` | Subtítulos, tab inactivo |
| `text-subtle` | `#94a3b8` | Descripciones, fechas |
| `text-dim` | `#6b7280` | Iconos, placeholder |
| `text-dimmer` | `#4c3a85` | Placeholder login, borde input |
| `cyan-header` | `#38bdf8` | Tint header, tab activo, demo |
| `green-success` | `#22c55e` | Progreso, completado |
| `green-title` | `#bbf7d0` | Título card completada |
| `green-desc` | `#86efac` | Descripción card completada |
| `orange-streak` | `#f97316` | Racha |
| `red-error` | `#ef4444` | Eliminar, logout |
| `border-default` | `#3b2c6b` | Bordes cards, inputs, skeleton |
| `border-completed` | `#14532d` | Borde card completada |

## 2. Tipografía

| Elemento | Size | Weight | Color |
|----------|------|--------|-------|
| Título pantalla (AlphaStudio AI) | 32 | 800 | `#ffffff` |
| Título login (ALPHA) | 22 | 800 | `#fff` |
| Subtítulo | 16 | — | `#a78bfa` |
| Texto input / botón | 13 | 700 | `#fff` |
| Título card | 14 | 700 | `#f8fafc` |
| Descripción card | 12 | — | `#94a3b8` |
| Chip text | 13 | 500 | `#e2e8f0` |
| Número progreso | 20 | 800 | `#22c55e` |
| Score racha | 44 | 900 | `#f97316` |
| Letra logo α | 34 | 900 | `#fff` |
| Letter-spacing ALPHA | 6 | — | — |

## 3. Radios

| Elemento | Radius |
|----------|--------|
| Cards (History, Roadmap) | 14 |
| Cards (Profile) | 16 |
| Inputs | 12 |
| Botón generar | 16 |
| Chips | 20 |
| Badge | 20 |
| Login card | 18 |
| Skeleton dot | 14 |
| Check circle | 999 (pill) |
| Progress bar | 999 |
| Avatar perfil | 32 |

## 4. Espaciados clave

| Contexto | Valor |
|----------|-------|
| Padding horizontal pantallas | 24 |
| Padding card | 14–22 |
| Gap chips | 10 |
| Gap resources | 6 |
| Gap card header | 10 |
| Margin bottom secciones | 32 |
| Padding top header (iOS / Android) | 80 / 48 |

## 5. Gradientes

- **Fondo todas las pantallas**: `['#09090b', '#0f0b1f', '#17122b']` con `StyleSheet.absoluteFill`
- **Botón primario Login / Avatar / Logo**: `['#8b5cf6', '#0ea5e9']`

## 6. Animaciones

| Screen | fadeAnim | slideAnim | Easing |
|--------|----------|-----------|--------|
| Login | 800ms | 650ms, from 30 | `Easing.out(Easing.cubic)` |
| Home | 800ms | 600ms, from 30 | `Easing.out(Easing.cubic)` |
| History | 600ms | 500ms, from 22 | `Easing.out(Easing.cubic)` |
| Profile | 700ms | 600ms, from 30 | `Easing.out(Easing.cubic)` |
| Roadmap | 700ms | 600ms, from 30 | `Easing.out(Easing.cubic)` |

- **Pulse Logo**: scale 1 → 1.08, 1800ms cada fase
- **Skeleton**: opacidad 0.3 → 1.0, 800ms cada fase
- **Card entry History**: 300ms, delay `index * 60`, slideX from 20
- **activeOpacity botones**: 0.8–0.85

## 7. Patrones de Componentes

### Botón primario
```
<TouchableOpacity activeOpacity={0.85}>
  <LinearGradient colors={['#8b5cf6', '#0ea5e9']} borderRadius=12>
```

### Input
```
flexDirection: row, alignItems: center, bg=#17122b, border=#3b2c6b, borderRadius=12, padding=12
```

### Card
```
flexDirection: row, bg=#0f0b1f, border=#3b2c6b, borderRadius=14, padding=14, gap=12
```

### Timeline (RoadmapScreen)
```
position: relative, paddingLeft: 6
line: position absolute, left: 20, top/bottom 10, width 2, bg #3b2c6b
dot wrap: width 40, alignItems center
check circle: 28x28, border 2 #8b5cf6, bg #0f0b1f
completed: bg #22c55e, border #22c55e
```

### Tab Bar / Header Nav
- Tab bar bg: `#0f0b1f`, border top: `#4c3a85`
- Active tint: `#38bdf8`, inactive: `#a78bfa`
- Header bg: `#0f0b1f`, tint: `#38bdf8`

## 8. Importaciones requeridas

- `LinearGradient` de `expo-linear-gradient`
- `Ionicons` de `@expo/vector-icons`
- `useAuthStore` de `../store/authStore`
- `useRoadmapStore` de `../store/roadmapStore`
- `AlphaLogo` de `../components/AlphaLogo`
