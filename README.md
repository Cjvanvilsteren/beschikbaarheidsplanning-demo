# Beschikbaarheidsplanning CUS

Sprint-capaciteitsplanning voor het cluster: elk teamlid geeft per werkdag aan of die
beschikbaar is, en de app rekent automatisch de beschikbare uren per persoon, per team
en per cluster uit. Vervangt het Excel-sheet met namen-in-rijen / dagen-in-kolommen.

Stack: React + TypeScript + Vite, Tailwind CSS v4, Firebase (Auth + Firestore), gehost
op GitHub Pages.

## 1. Firebase-project opzetten

1. Ga naar de [Firebase console](https://console.firebase.google.com/) → **Project toevoegen**.
2. **Authentication** → **Sign-in method** → schakel **Email/Password** in. (Microsoft-login
   kan later als extra of vervangende provider toegevoegd worden zodra de IT-afdeling de
   app in de Microsoft-tenant wil registreren — dat vraagt geen codewijziging in `useAuth.ts`.)
3. **Firestore Database** → **Database maken** → start in production mode (de rules in
   [`firestore.rules`](firestore.rules) regelen de toegang).
4. Publiceer de rules: kopieer de inhoud van `firestore.rules` naar
   **Firestore → Rules** in de console (of via de Firebase CLI: `firebase deploy --only firestore:rules`).
5. **Projectinstellingen** → **Je apps** → **Web-app toevoegen**. Kopieer de config-waarden.

## 2. Teams aanmaken

De teams worden handmatig aangemaakt (geen admin-UI in de app). Maak in
**Firestore → teams** per team een document met een zelfgekozen id en velden:

| veld  | type   | voorbeeld    |
| ----- | ------ | ------------ |
| name  | string | "App team"   |
| order | number | 1            |

De 8 teams: App team, Web team, Klantenservice Tooling, Kennismannagement, Design
system, Design team, Egain, Overhead team (voor PDM, SM, Architect en MO die niet aan
één team gebonden zijn).

`order` bepaalt de volgorde in dropdowns/overzicht.

## 3. Lokaal draaien

```bash
cp .env.example .env
```

Vul `.env` met de config-waarden uit stap 1.5.

```bash
npm install
npm run dev
```

Nieuwe gebruikers maken zelf een account aan (e-mailadres + wachtwoord, via "Nog geen
account?" op het inlogscherm) en komen daarna in een onboardingscherm terecht: naam,
team(s), rol en vaste niet-werkdagen invullen. Daarna verschijnt het
beschikbaarheidsrooster van je (eerste) team.

## 4. Deploy naar GitHub Pages

1. Push deze repo naar GitHub.
2. **Settings → Pages → Source**: zet op **GitHub Actions**.
3. **Settings → Secrets and variables → Actions**: voeg secrets toe met dezelfde namen
   als in `.env.example` (`VITE_FIREBASE_API_KEY`, etc.).
4. Push naar `main` — de workflow in `.github/workflows/deploy.yml` bouwt en publiceert
   automatisch. De base-URL wordt automatisch op de repo-naam gezet.
5. Zodra je Microsoft (of een andere OAuth-provider) toevoegt: voeg het resulterende
   `*.github.io`-domein dan toe aan **Authentication → Settings → Authorized domains** —
   voor Email/Password is dat niet nodig.

## Datamodel

- `teams/{teamId}` — `{ name, order }`
- `members/{uid}` — `{ uid, name, email, teamIds, nonWorkingWeekdays, role }`
- `availability/{sprintNummer}/entries/{uid}` — `{ unavailable: Record<datum, reden> }`

`teamIds` is een array — iemand kan in meerdere teams zitten (bv. PDM, SM, Architect of
MO in het Overhead team én in een los team). Er is één gedeelde kalender per persoon,
niet gesplitst per team: wie afwezig is, is dat voor alle teams waar hij in zit, en telt
daar vol mee in de capaciteit (dus geen FTE-splitsing per team).

Sprintnummering: sprints duren 3 weken; sprint 190 start op 2026-09-17. Alle andere
sprintnummers en -datums worden hiervan afgeleid (zie `src/lib/sprints.ts`). Nederlandse
feestdagen (Nieuwjaarsdag, 2e Paasdag, Koningsdag, Bevrijdingsdag, Hemelvaart, 2e
Pinksterdag, 1e/2e Kerstdag) worden automatisch berekend en verschijnen niet als kolom
— niemand hoeft ze los aan te vinken (zie `src/lib/holidays.ts`).

## Bediening van het rooster

- **Klik** op een dag in je eigen rij om 'm te markeren als afwezig; klik nogmaals om de
  reden te doorlopen (🏖️ Verlof → 🤒 Ziek → 🎓 Opleiding → weer beschikbaar).
  De emoji staan in `REASON_EMOJI` (`src/types/index.ts`); de tekstlabel blijft altijd in
  de tooltip/aria-label staan, nooit alleen emoji.
- **Klik-en-sleep** over meerdere dagen om ze allemaal in één keer op dezelfde status te
  zetten (handig voor een week verlof).
- **+ Periode invullen** (in de "Jouw beschikbaarheid"-balk) heeft twee modi, beide werken
  over sprintgrenzen heen (in tegenstelling tot klik-en-sleep, dat binnen één sprint
  blijft):
  - **Aaneengesloten**: een van-tot datumrange (`fillAbsenceRange`), voor een vakantie of
    ziekteperiode.
  - **Herhalend**: één weekdag, elke N weken, tussen twee data (`fillRecurringAbsence` +
    `datesMatchingWeeklyPattern` in `src/lib/sprints.ts`) — voor een vast maar *niet*
    wekelijks ritme. Een wisselend patroon zoals "donderdag deze week, vrijdag volgende
    week" vul je in als twee herhalingen van elke 2 weken, elk met een andere startdag.
  Beide slaan weekenden/feestdagen/je eigen vrije dagen automatisch over.
- Een **lage-bezetting-badge** verschijnt zodra de sprintcapaciteit onder 65% (waarschuwing)
  of 40% (kritiek) van het maximum zakt — zowel op het teamrooster als op de teamkaarten
  in het Cluster-overzicht (drempels in `src/lib/capacity.ts`).
- Naast het uren-totaal staat het verschil met de vorige sprint.

Elk teamlid heeft een **werkpatroon** (`workPattern` op het member-document, zie
`src/types/index.ts` en de resolutie-logica in `src/lib/capacity.ts`): 1–4 afwisselende
weken, en per week een urenaantal per werkdag (0 = geen werkdag die dag). De meeste
mensen hebben gewoon 1 week (altijd hetzelfde) met 8u op Ma–Vr. Dat dekt zowel fulltime
als een vaste parttime dag (bv. nooit op vrijdag, gewoon 0u die dag) én een wisselend
ritme over meerdere weken (bv. "ma/di/wo 4u" de ene week, "di/wo/do 4u" de andere — twee
weken instellen, `anchorDate` bepaalt welke kalenderweek "week 1" is). Niet-werkdagen
tellen niet mee in de capaciteit en zijn in het rooster grijs en niet-klikbaar, voor
iedere sprint automatisch — `isWorkingDay`/`hoursForDay` rekenen voor elke dag opnieuw
uit welke patroonweek van toepassing is. Oudere member-documenten zonder `workPattern`
vallen automatisch terug op fulltime (`DEFAULT_WORK_PATTERN`) — geen migratie nodig.

Dit veld staat *niet* in de onboarding (bewust kort gehouden: alleen naam, team(s), rol).
Iedereen kan het zelf later instellen via de **Profiel**-knop rechtsboven in de nav
(hetzelfde formulier als onboarding, maar dan met de `WorkPatternEditor` erbij) — niet
alleen een admin. `src/components/EditMemberModal.tsx` wordt hiervoor hergebruikt, zowel
voor jezelf (via Nav) als voor een admin die iemand anders bewerkt (via het ✎-potloodje
in het rooster).

## Rollen

Tien disciplines: **Developer, Tester, QA, Designer, PO, SM, BA, PDM, MO, Architect**.
Iedereen kiest zijn eigen rol bij het onboardingscherm (net als team(s)) en kan die later
zelf aanpassen. De rol-kleuren zijn gevalideerd voor kleurenblindheid (zie `src/index.css`)
— het gevalideerde kleurenpalet zit op 8 onderscheidbare kleuren, dus Architect (9de rol)
rijdt bewust mee op de neutrale grijstint, en QA (10de rol) deelt de kleur van Tester (een
nauw verwante discipline) in plaats van dat er een niet-gevalideerde kleur bij verzonnen is.

De uren-breakdown per rol is zichtbaar op het teamrooster en op elke teamkaart in het
Cluster-overzicht (gekleurde balk + legenda). Alleen PO's en SM's zien de
**Cluster**-pagina zelf (uren-vergelijking tussen alle teams); gewone teamleden zien
alleen hun eigen teamroosters. Wie in meerdere teams zit, krijgt in de nav een
team-schakelaar in plaats van één vaste "Mijn team"-link.

## Rechten

- Iedereen die ingelogd is, kan alle teams/leden/beschikbaarheid lezen.
- Een teamlid kan alleen zijn eigen profiel en zijn eigen beschikbaarheid bewerken
  (afgedwongen via `firestore.rules`, niet alleen in de UI), en alleen met een geldige
  rol en minstens één team.
- Een **admin** (`isAdmin: true` op het member-document) kan alles lezen én overal in
  schrijven: ieders beschikbaarheid aanpassen, en via het ✎-potloodje naast een naam in
  het rooster iemands team(s)/rol/niet-werkdagen bewerken. `isAdmin` is nooit zelf te
  zetten via de app — alleen via de Firestore-console of een admin-script, nooit door de
  gebruiker zelf (zie `firestore.rules`, functie `isAdminCaller`).

## Overzichten

- **Jouw beschikbaarheid**: een losse balk bovenaan elk teamrooster (alleen zichtbaar als
  je zelf in dat team zit) om snel je eigen dagen in te vullen zonder jezelf te hoeven
  opzoeken in de volledige lijst.
- **Iedereen** (`/iedereen`, alleen voor PO/SM/admin): alleen-lezen rooster van alle leden
  in het cluster, team-onafhankelijk, met de team(s) van iedereen erbij.
- **Team-inzichten**: op elk teamrooster vier kaartjes — wie er vandaag afwezig is, wie de
  komende 7 dagen afwezig gaat (met datumrange, bv. "ma 10 nov – wo 12 nov"), de werkdag
  met de laagste bezetting in de bekeken sprint, en roldekking-gaten (dagen waarop een rol
  die in het team voorkomt nul beschikbare mensen heeft). Logica in `src/lib/insights.ts`.
- **Cluster-inzichten** (`src/components/ClusterInsights.tsx`, op het Cluster dashboard):
  teams gerangschikt op bezetting (laagste eerst, met status-kleur), wie er cluster-breed
  vandaag afwezig is, en de rolverdeling over alle teams samen — het cluster-brede
  tegenhanger van de per-team inzichten.
