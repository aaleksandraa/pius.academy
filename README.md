# PMU Academy - Vue.js Frontend

## Zahtjevi

- Node.js 18+
- npm ili yarn

## Instalacija

### 1. Instaliraj zavisnosti

```bash
cd frontend
npm install
```

### 2. Konfiguriši environment

```bash
cp .env.example .env
```

Uredi `.env` fajl ako je potrebno:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Pokreni development server

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:5173`

### 4. Build za produkciju

```bash
npm run build
```

## Struktura projekta

```
frontend/
├── src/
│   ├── assets/          # CSS i statički fajlovi
│   ├── components/      # Vue komponente
│   ├── layouts/         # Layout komponente
│   ├── lib/             # Utility funkcije (API client)
│   ├── router/          # Vue Router konfiguracija
│   ├── stores/          # Pinia stores
│   ├── views/           # Stranice
│   ├── App.vue          # Root komponenta
│   └── main.ts          # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Funkcionalnosti

- **Autentifikacija** - Login, logout, promjena lozinke
- **Feed** - Objave, komentari, zakačene objave
- **Kursevi** - Video lekcije (Vimeo)
- **Zoom snimci** - Arhiva snimaka
- **Testovi** - Online testiranje sa rezultatima
- **Pitanja** - Q&A sekcija
- **Radovi** - Upload studentskih radova sa feedback-om
- **Admin panel** - Upravljanje korisnicima, kursevima, testovima

## Tehnologije

- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- Vue Router
- Tailwind CSS
- Axios
- Lucide Icons
