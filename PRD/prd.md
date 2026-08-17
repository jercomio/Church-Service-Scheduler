# PRD — Church Service Scheduler (planning de service)

**Version :** 1.0
**Date :** 2026-08-12
**Statut :** Validé
**Document source :** `PRD/idea.md`

---

## 1. Contexte

Une église souhaite établir et maintenir un planning de service pour les membres de son équipe vidéo. Aujourd'hui, la répartition des services se fait manuellement (oralement, par messages), ce qui génère des oublis, des déséquilibres de charge et des conflits d'horaire.

Exemple de besoin : l'équipe vidéo est composée de 2 personnes qui se partagent les services du **dimanche matin** (culte) et du **mercredi soir** (étude biblique).

L'application doit permettre au coordinateur de l'équipe de planifier les assignations de manière simple et équitable, et aux membres de consulter leur planning à tout moment.

## 2. Objectifs

### 2.1 Objectif principal
Fournir une application mobile **iOS et Android** permettant de planifier les jours de service d'une équipe, avec des créneaux configurables.

### 2.2 Objectifs secondaires
- Réduire la charge mentale du coordinateur (répartition automatique / équitable).
- Réduire les oublis grâce aux notifications email + in-app.
- Offrir une expérience intuitive, moderne et responsive sur mobile et tablette.
- Garantir un code maintenable (clean code, clean architecture, adapter pattern) pour évoluer rapidement (multi-équipes, pricing, autres églises).

## 3. Décisions clés (scope confirmé)

| Sujet | Décision | Justification |
|---|---|---|
| Plateforme | **Expo / React Native** (iOS + Android) | Conforme à la stack technique |
| PWA / Web | **Hors périmètre v1** | L'architecture (domaine pur, adaptateurs) permet d'ajouter une cible web plus tard |
| Organisation | **Une seule équipe (service vidéo)** | Cas d'usage initial ; le modèle de données reste extensible à plusieurs équipes |
| Créneaux | **Configurables** (jour, heure début/fin, label) | Défauts : dimanche matin + mercredi soir |
| Notifications | **Email + in-app** | Rappels J-7 / J-1, alertes de changement |
| Pricing | **Gratuit pour l'instant** | Feature flags actifs dès le v1, tarification désactivée |
| Langue UI | **Anglais** | — |
| Manifeste des URLs | **Garde de navigation côté client** | Liste blanche de routes, erreur sur route inconnue |
| API | **Versionnée** (`/api/v1`) | Évolution sans rupture |
| ORM | **Prisma** derrière Clean Architecture | Échange DB/ORM possible sans toucher au code applicatif |

## 4. Personas

### 4.1 Coordinateur (admin)
- Crée et gère les membres de l'équipe.
- Définit les créneaux de service.
- Assigne les membres aux services.
- Ajuste manuellement le planning si nécessaire.
- Suit l'équilibre de répartition.

### 4.2 Membre
- Consulte son planning (prochain service, vue semaine/mois).
- Reçoit les notifications (email + in-app).
- Vérifie ses disponibilités passées / futures.

## 5. Périmètre

### 5.1 Inclus dans le v1
- Authentification (email/mot de passe + magic link via Supabase Auth).
- Gestion de l'équipe : création, liste des membres, profils.
- Créneaux de service configurables (défauts : dimanche matin, mercredi soir).
- Planning : vue semaine, vue mois, assignations des membres aux créneaux.
- Répartition automatique équitable (rotation) avec ajustement manuel.
- Notifications email (rappel J-7 / J-1, changement d'assignation) et in-app (badge + liste).
- Feature flags par utilisateur (préparation au pricing).
- Route guard (manifeste des URLs) côté client.
- API REST versionnée, clean architecture, adapter pattern UI.

### 5.2 Hors périmètre (post-v1)
- Multi-équipes (le modèle de données le permet).
- Multi-églises / tenants.
- Demandes de congés / indisponibilités déclarées par les membres.
- Échange d'horaire entre membres avec validation.
- Pricing / paiements / abonnements.
- Mode hors-ligne complet.
- PWA / application web.
- Push notifications (Web Push / APNs) — réévalué après v1.

## 6. Exigences fonctionnelles

### 6.1 Authentification (AUTH)
| ID | Exigence | Priorité |
|---|---|---|
| AUTH-01 | Connexion par email + mot de passe via Supabase Auth | Haute |
| AUTH-02 | Connexion par magic link (email) | Moyenne |
| AUTH-03 | Inscription : créer un compte, rejoindre l'équipe | Haute |
| AUTH-04 | Déconnexion, réinitialisation de mot de passe | Haute |
| AUTH-05 | Gestion de session persistante (Supabase Auth, refresh token) | Haute |

### 6.2 Équipe et membres (MEM)
| ID | Exigence | Priorité |
|---|---|---|
| MEM-01 | Le coordinateur peut créer/lire/mettre à jour/supprimer des membres | Haute |
| MEM-02 | Chaque membre a : nom, prénom, email, rôle (coordinateur/membre), actif | Haute |
| MEM-03 | Un membre peut être marqué inactif (sans suppression) | Moyenne |
| MEM-04 | Le coordinateur peut inviter un membre (email) | Moyenne |

### 6.3 Créneaux de service (SLOT)
| ID | Exigence | Priorité |
|---|---|---|
| SLOT-01 | Création/édition/suppression de créneaux : `dayOfWeek`, `startTime`, `endTime`, `label` | Haute |
| SLOT-02 | Créneaux par défaut au premier lancement : dimanche matin (ex. 09:00–12:00), mercredi soir (ex. 19:00–21:00) | Haute |
| SLOT-03 | Possibilité de désactiver un créneau sans le supprimer | Moyenne |

### 6.4 Planning (PLAN)
| ID | Exigence | Priorité |
|---|---|---|
| PLAN-01 | Vue **semaine** : colonnes par jour, créneaux, assignations | Haute |
| PLAN-02 | Vue **mois** : aperçu des services par jour | Moyenne |
| PLAN-03 | Assignation manuelle : affecter un membre à un créneau pour une date donnée | Haute |
| PLAN-04 | Réaffectation / suppression d'une assignation | Haute |
| PLAN-05 | Règle de non-conflit : un membre ne peut pas être assigné à 2 créneaux le même jour | Haute |
| PLAN-06 | Répartition automatique équitable (rotation) : suggérer la prochaine assignation au membre le moins sollicité | Moyenne |
| PLAN-07 | Consultation du planning en lecture seule par les membres | Haute |
| PLAN-08 | Le membre voit « Mon prochain service » en surbrillance | Moyenne |

### 6.5 Notifications (NOTIF)
| ID | Exigence | Priorité |
|---|---|---|
| NOTIF-01 | Rappel email automatique **J-7** avant un service | Moyenne |
| NOTIF-02 | Rappel email automatique **J-1** avant un service | Haute |
| NOTIF-03 | Email de notification en cas de **changement/annulation** d'assignation | Haute |
| NOTIF-04 | Notification **in-app** persistante (table + badge + liste) | Moyenne |
| NOTIF-05 | Les notifications in-app sont marquées comme lues | Moyenne |

### 6.6 Feature flags (FLAG)
| ID | Exigence | Priorité |
|---|---|---|
| FLAG-01 | Table `Feature` : `key` (unique), `name`, `description`, `enabled:boolean` | Haute |
| FLAG-02 | Table `FeatureUser` : `featureId`, `userId`, `enabled:boolean` (activation par utilisateur) | Haute |
| FLAG-03 | Le client expose un hook `useFeatureFlag(featureKey)` et masque les fonctionnalités désactivées | Haute |
| FLAG-04 | Préparation au pricing : une feature peut être activée/désactivée par niveau tarifaire (champ `tier`) | Basse |

### 6.7 Manifeste des URLs (URL)
| ID | Exigence | Priorité |
|---|---|---|
| URL-01 | Liste blanche des routes autorisées (route guard côté client, Expo Router) | Haute |
| URL-02 | Toute route hors liste blanche affiche un écran d'erreur dédié (404 personnalisé) | Haute |
| URL-03 | Les routes protégées (auth requise) redirigent vers l'écran de connexion | Haute |

## 7. Exigences non fonctionnelles

| Catégorie | Exigence |
|---|---|
| **Performance** | Temps de démarrage < 3 s ; rendu fluide (60 fps) ; données mises en cache (TanStack Query) |
| **Sécurité** | Auth Supabase (JWT), Row Level Security (RLS) sur la DB, secrets en variables d'environnement, aucune donnée sensible en clair dans le client |
| **Accessibilité** | Conformité WCAG 2.1 AA (contrastes, tailles tactiles ≥ 44 px, labels, Dynamic Type, VoiceOver/TalkBack) |
| **Responsive** | Adaptation parfaite smartphone + tablette (portrait/paysage) |
| **Qualité code** | Clean code, clean architecture, adapters pour toute dépendance externe, TypeScript strict, tests |
| **Sécurité API** | Rate limiting, validation des entrées (Zod), erreurs standardisées, versioning `/api/v1` |
| **Maintenabilité** | ORM interchangeable (Prisma derrière interface repository) ; UI lib interchangeable (adapter pattern) |

## 8. Architecture technique

### 8.1 Vue d'ensemble

```
┌──────────────────────┐   HTTPS /api/v1   ┌─────────────────────────────┐
│  Mobile App (Expo)   │ ─────────────────► │  Backend Node (TypeScript)  │
│  iOS + Android       │                    │  Clean Architecture         │
│  RN + TypeScript     │ ◄───────────────── │  REST API versionnée        │
└──────────────────────┘                    └───────────┬─────────────────┘
       │  auth (JWT)                                     │ Prisma
       ▼                                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Supabase                                       │
│   Auth (users)  +  PostgreSQL (tables applicatives, RLS)             │
└──────────────────────────────────────────────────────────────────────┘
```

- **Auth** : Supabase Auth (email/password, magic link). Le JWT Supabase est vérifié par le backend.
- **Persistance** : PostgreSQL hébergé sur Supabase, accédé via **Prisma** par le backend.
- **Emails** : provider email (ex. Resend) via un adaptateur, invoqué par le backend (cron ou Edge Function).
- **Rappels** : job planifié (cron) qui évalue les assignations à J-7 / J-1 et envoie les emails.

### 8.2 Clean Architecture (backend)

```
src/
  domain/            # Entités, valeurs, règles métier (sans dépendance externe)
  application/       # Use cases (ex: AssignMemberToSlot, NotifyUpcomingShift)
    ports/           # Interfaces : MemberRepository, SlotRepository, Notifier...
  infrastructure/    # Implémentation : PrismaRepository, SupabaseAuthProvider,
                     #   ResendEmailProvider, schedulers/cron
  presentation/      # Contrôleurs REST, validation Zod, routes /api/v1
```

Règle de dépendance : `presentation → application → domain` ; `infrastructure` implémente les ports. Changer Prisma pour un autre ORM (ou Supabase pour un autre fournisseur) ne modifie que `infrastructure`.

### 8.3 Stack applicative (mobile)

| Couche | Choix |
|---|---|
| Framework | Expo SDK 53, React Native, TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (TailwindCSS) |
| UI base | Shadcn/ui pour RN (react-native-reusables) **derrière une couche d'adaptateurs** |
| Icônes | lucide-react-native |
| Data fetching | TanStack Query (serveur) + Zustand (état client) |
| Validation | Zod (partagé avec le backend) |
| Tests | Vitest (unitaires), Maestro (E2E) |

### 8.4 Adapter Pattern (UI)

Aucun composant de librairie UI n'est utilisé directement dans les écrans.

```
ui/
  Button.tsx                  # API stable (variant, disabled, onClick...)
  Button.types.ts
  adapters/
    ShadcnButtonAdapter.tsx   # implémentation actuelle (react-native-reusables)
    MuiButtonAdapter.tsx      # future alternative
```

- Le composant stable (`Button`, `Input`, `Select`, `Modal`, etc.) délègue à un adaptateur.
- Changer de librairie UI = changer la ligne d'import dans l'adaptateur, sans toucher aux écrans.
- Même principe pour les providers non-UI (auth, email, storage).

### 8.5 Manifeste des URLs (route guard)

- Fichier `navigation/routes.manifest.ts` listant les routes autorisées (ex. `/login`, `/dashboard`, `/planning`, `/members`, `/slots`, `/notifications`, `/settings`).
- Guard d'authentification + validation de la route : route inconnue → écran `NotFound`.
- Implémentation via Expo Router (layout racine + helper `isRouteAllowed()`).

## 9. Modèle de données

### 9.1 Relations

```
User 1───1 Member (via user_id, optionnel)
Team 1───* Member
Member 1───* Shift
Slot 1───* Shift
User 1───* FeatureUser  *───1 Feature
User 1───* Notification
```

### 9.2 Tables (extrait Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  role          Role     @default(MEMBER) // COORDINATOR | MEMBER
  member        Member?
  features      FeatureUser[]
  notifications Notification[]
  createdAt     DateTime @default(now())
}

model Team {
  id      String   @id @default(cuid())
  name    String
  members Member[]
  slots   Slot[]
}

model Member {
  id        String   @id @default(cuid())
  teamId    String
  userId    String?  @unique // null si invité non inscrit
  firstName String
  lastName  String
  email     String?
  isActive  Boolean  @default(true)
  shifts    Shift[]
}

model Slot {
  id        String    @id @default(cuid())
  teamId    String
  dayOfWeek Int       // 0 = Sunday ... 6 = Saturday
  startTime String    // "HH:mm"
  endTime   String
  label     String    // ex. "Sunday Morning Worship"
  isActive  Boolean   @default(true)
  shifts    Shift[]
}

model Shift {
  id         String   @id @default(cuid())
  slotId     String
  memberId   String
  date       DateTime // date du service
  createdAt  DateTime @default(now())
  @@unique([slotId, memberId, date])
}

model Feature {
  id          String  @id @default(cuid())
  key         String  @unique // ex. "auto-rotation", "month-view"
  name        String
  description String?
  enabled     Boolean @default(true)
  tier        String? // réservé au futur pricing
  users       FeatureUser[]
}

model FeatureUser {
  featureId String
  userId    String
  enabled   Boolean @default(true)
  @@id([featureId, userId])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  title     String
  body      String
  readAt    DateTime?
  createdAt DateTime  @default(now())
}
```

### 9.3 Feature flags
- `Feature.enabled` : état global de la fonctionnalité.
- `FeatureUser.enabled` : surcharge par utilisateur (ex. `auto-rotation` activée uniquement pour le coordinateur).
- `Feature.tier` : niveau tarifaire requis (réservé au futur pricing ; aucune logique de billing en v1).

## 10. API REST

### 10.1 Versioning
Toutes les routes sont préfixées par `/api/v1`. Toute évolution majeure introduit `/api/v2` sans casser `/api/v1`.

### 10.2 Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Connexion (délègue à Supabase Auth) |
| POST | `/api/v1/auth/magic-link` | Envoi d'un magic link |
| GET | `/api/v1/team` | Équipe et créneaux du coordinateur |
| GET/POST | `/api/v1/members` | Lister / créer un membre |
| PATCH/DELETE | `/api/v1/members/:id` | Modifier / supprimer un membre |
| GET/POST | `/api/v1/slots` | Lister / créer un créneau |
| PATCH/DELETE | `/api/v1/slots/:id` | Modifier / désactiver / supprimer un créneau |
| GET | `/api/v1/shifts?week=2026-08-17` | Planning hebdomadaire |
| POST | `/api/v1/shifts` | Assigner un membre à un créneau/date |
| PATCH/DELETE | `/api/v1/shifts/:id` | Modifier / annuler une assignation |
| POST | `/api/v1/shifts/suggest` | Suggestion de rotation (membre le moins sollicité) |
| GET | `/api/v1/notifications` | Notifications in-app de l'utilisateur |
| PATCH | `/api/v1/notifications/:id/read` | Marquer comme lue |
| GET | `/api/v1/features` | Flags actifs de l'utilisateur connecté |
| POST | `/api/v1/cron/shift-reminders` | (interne, protégé) Évaluation des rappels J-7/J-1 |

### 10.3 Erreurs standardisées
```json
{
  "error": {
    "code": "SHIFT_CONFLICT",
    "message": "Member is already assigned to another slot on this day",
    "details": {}
  }
}
```

## 11. UX / UI

### 11.1 Écrans
1. **Onboarding / Auth** — logo, connexion (email/mot de passe, magic link), inscription.
2. **Dashboard** — prochain service du membre (date, créneau, heure), statistiques simples (nb de services), boutons d'accès rapide.
3. **Planning** — onglets **Semaine** / **Mois** ; cartes d'assignation par créneau ; appui long / bouton pour assigner ; drag & drop si applicable.
4. **Membres** — liste (avatar, rôle, badge actif/inactif), écran de détail, formulaire de création.
5. **Créneaux** — liste des créneaux configurables, formulaire jour/heures/label, toggle actif/inactif.
6. **Notifications** — liste in-app (lues/non lues), badge sur l'onglet.
7. **Settings** — profil, préférences (rappels email on/off), déconnexion, version.

### 11.2 Design
- Thème clair et sombre, tokens via NativeWind.
- Design moderne et soigné : espacement cohérent, typographie lisible, hiérarchie claire.
- Chaque action dispose d'états : chargement, vide, erreur, succès.
- Mise en évidence du service actuel/passé/suivant par couleur.

### 11.3 Parcours principaux
- **Coordinateur** : connexion → vérifier le planning de la semaine → assigner un membre libre sur un créneau → le membre reçoit un email + notification in-app.
- **Membre** : connexion → voir « Mon prochain service » sur le dashboard → activer les rappels email → recevoir J-7 / J-1.

## 12. Notifications

### 12.1 Email (via backend)
| Déclencheur | Timing | Destinataire |
|---|---|---|
| Nouvelle assignation / changement | Immédiat | Membre concerné |
| Annulation d'assignation | Immédiat | Membre concerné |
| Rappel service | J-7 | Membre assigné |
| Rappel service | J-1 | Membre assigné |

### 12.2 In-app
- Table `Notification` ; badge = nombre de notifications non lues.
- Créée lors de chaque assignation/changement, en plus de l'email.

## 13. Tests & qualité

| Niveau | Outil | Couverture |
|---|---|---|
| Unitaires (domaine + use cases) | Vitest | Règles de rotation, non-conflit, feature flags |
| Composants | Vitest + Testing Library RN | Adapters UI, écrans clés |
| API | Vitest + Supertest | Endpoints v1, erreurs, validation |
| E2E mobile | Maestro | Parcours coordinateur + membre |
| Lint / types | ESLint, Prettier, `tsc --strict` | CI obligatoire |

CI/CD : lint + types + tests unitaires + tests API à chaque PR ; E2E sur branche `main`.

## 14. Jalons de livraison

| Jalon | Contenu | Critère de sortie |
|---|---|---|
| **M0 — Fondations** | Monorepo, Expo + backend, CI, Supabase Auth, Prisma, clean architecture, adapter Button | Connexion OK, CI verte |
| **M1 — Domaine planning** | CRUD membres, créneaux configurables, assignations, non-conflit, endpoint shifts | Assignation manuelle fonctionnelle |
| **M2 — UX planning** | Dashboard, vues semaine/mois, route guard, 404 | Parcours coordinateur complet |
| **M3 — Notifications** | Emails (J-7/J-1/changements), notifications in-app | Rappels testés en réel |
| **M4 — Rotation & flags** | Suggestion de rotation, feature flags par utilisateur, settings | Flags activables par user |
| **M5 — Polissage** | Accessibilité, thème sombre, E2E, tests complets | Release candidate, stores iOS/Android |

## 15. Métriques de succès

- % de services couverts sans litige de planning (aucun membre non informé).
- Équilibre de répartition : écart max de services entre membres ≤ 1 sur 1 mois.
- Temps moyen de création d'un planning hebdomadaire < 5 min.
- Taux d'ouverture des emails de rappel ≥ 70 %.
- Note d'app store ≥ 4.5.

## 16. Risques & mitigations

| Risque | Impact | Mitigation |
|---|---|---|
| Faible adoption (outil jugé complexe) | Élevé | UX minimale par parcours, écrans épurés, feedback utilisateur |
| Supabase Auth + Prisma : désynchronisation `User` | Moyen | `User` créé côté Supabase, backfill via webhook/trigger ; `userId` unique sur `Member` |
| Algorithme de rotation perçu comme injuste | Moyen | Suggestion = option (jamais automatique), visibilité des compteurs de services |
| Dépendance à une lib UI / un fournisseur | Moyen | Adapter pattern pour UI, email, auth, ORM |
| Portée (multi-équipes, pricing) | Élevé | Mise en place des tables extensibles dès v1, hors périmètre documenté |

## 17. Hors périmètre (rappels)

Multi-équipes, multi-églises, indisponibilités déclarées, échanges validés, pricing/paiements, mode hors-ligne, push notifications, PWA/web.
