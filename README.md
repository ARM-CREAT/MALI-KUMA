# KUMA — Messagerie et appels (PWA)

Application web installable (PWA) façon WhatsApp : connexion par numéro de
téléphone, discussions et groupes en temps réel, notes vocales, photos, Actus
24 h, appels audio/vidéo 1-à-1 et de groupe. HTML/CSS/JS en **un seul
`index.html`** + Firebase (Auth, Firestore, Storage).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Toute l'application. Seule partie à modifier : `firebaseConfig` (et `RTC_CONFIG` pour le TURN), tout en haut des scripts. |
| `manifest.json`, `service-worker.js`, `icons/` | Installation sur téléphone + ouverture hors-ligne. Doivent rester à côté d'`index.html`. |
| `firestore.rules`, `storage.rules` | Règles de sécurité à publier dans Firebase. |
| `firestore.indexes.json` | Index Firestore nécessaires (sans eux, la liste des discussions reste vide). |
| `firebase.json` | Permet de tout publier d'une commande avec l'outil `firebase`. |

## Mise en route

1. **Firebase** (console.firebase.google.com) :
   - Authentication → Sign-in method → activer **Téléphone**.
   - Authentication → Settings → **Domaines autorisés** → ajouter votre domaine Vercel.
   - Authentication → Settings → **SMS region policy** : autoriser les pays visés (Mali, Espagne, France…).
   - Créer **Firestore Database** et **Storage**.
   - Paramètres du projet → Vos applications → Web → copier la config dans `firebaseConfig` (`index.html`).
2. **Règles et index** (depuis ce dossier) :
   ```
   npm install -g firebase-tools
   firebase login
   firebase use --add          # choisir le projet
   firebase deploy --only firestore,storage
   ```
   Sans l'outil : copier-coller `firestore.rules` et `storage.rules` dans la
   console ; pour les index, ouvrez l'app, et si un message « Index Firestore
   manquant » apparaît, la console du navigateur (F12) donne un lien qui crée
   l'index en un clic.
   Au premier déploiement de `storage.rules`, Firebase demande d'autoriser
   Storage à lire Firestore (vérification des membres d'une discussion) : acceptez.
3. **Déployer** le dossier sur Vercel comme d'habitude (glisser-déposer GitHub).

### Conseillé

- **Numéros de test** (Authentication → Sign-in method → Téléphone → *Numéros
  de téléphone pour les tests*) : se connecter sans SMS ni forfait Blaze pendant
  les essais. Les vrais SMS demandent le forfait **Blaze**.
- **Suppression réelle des messages éphémères** : Firestore → *TTL* → créer une
  règle sur le groupe de collections `messages`, champ `expiresAt` (et une sur
  `statuses`, champ `expiresAt`). Sans cela, les messages expirés sont masqués
  dans l'app mais restent stockés.
- **Serveur TURN** pour les appels entre réseaux différents (4G ↔ wifi, pays
  différents) : sans lui, beaucoup d'appels échouent. Compte gratuit possible sur
  dashboard.metered.ca, puis remplir `RTC_CONFIG` dans `index.html`.

## Fonctionnalités

- Connexion par SMS (OTP) avec messages d'erreur clairs en français, renvoi du
  code, choix de langue (français, bamanankan, fulfulde, soninké, tamasheq).
- Discussions et groupes en temps réel, recherche, filtres Toutes / Non lues /
  Favoris / Groupes, compteur de non-lus (onglet + titre de la page).
- Nouvelle discussion **par numéro de téléphone** (+ bouton d'invitation si la
  personne n'est pas encore sur KUMA).
- « en ligne », « vu(e) à… », « écrit… », coches ✓ / ✓✓ / ✓✓ bleues, 🕓 hors-ligne.
- Réactions, réponse citée, transfert, copie, modification (15 min), suppression
  pour tous, épinglage, liens cliquables, séparateurs de date.
- Notes vocales compressées (≈ 24 kbit/s) et photos redimensionnées avant envoi
  (économie de data en 2G/3G), légende sur les photos.
- Actus 24 h (texte coloré ou photo), visibles uniquement par vos contacts,
  compteur de vues.
- Appels audio/vidéo 1-à-1 et de groupe : sonnerie, accepter/refuser, micro et
  caméra coupables, durée, « occupé », « sans réponse » après 45 s, historique
  avec rappel en un geste.
- Confidentialité : masquer « en ligne »/dernière connexion, désactiver les
  confirmations de lecture, bloquer/débloquer, messages éphémères (24 h, 7 j, 90 j).
- Profil (nom, infos), favoris, quitter un groupe, ajout de participants (admin).
- Hors-ligne : l'app s'ouvre sans réseau et les messages partent au retour de la connexion.

## Corrections de la révision du 10/10/2026

Bloquants :
- Onglets **Actus** et **Appels** qui plantaient (identifiants HTML en double).
- Noms avec apostrophe (ex. **N'Diaye**) qui cassaient les boutons ; texte
  pouvant injecter du HTML dans la page (désormais tout est échappé).
- Démarrage de la session parfois avant le chargement complet de la page.
- Requêtes refusées par les règles (appels entrants, appels de groupe) et index
  Firestore manquants.
- Candidats réseau des appels perdus quand ils arrivaient trop tôt → appels qui
  ne se connectaient pas.
- Messages éphémères « 90 jours » supprimés immédiatement.
- Nom du compte écrasé par « Utilisateur KUMA » à la reconnexion.
- Statut « en ligne » qui restait affiché après fermeture de l'app.

Sécurité et coûts :
- Annuaire des numéros plus téléchargeable en entier ; Actus visibles
  seulement par les contacts ; un membre ne peut plus modifier les messages des
  autres (seulement réagir) ; fichiers limités en taille et en type.
- Accusés de lecture par discussion au lieu d'une écriture par message lu.
- Présence suivie contact par contact au lieu de toute la collection `users`.

Ergonomie : note vocale qui n'est plus coupée à l'arrivée d'un message, nom de
l'expéditeur dans les groupes, bouton retour du téléphone, icônes de l'app,
service worker qui ne bloque plus les mises à jour.

## Limites connues

- Pas de notification quand l'app est complètement fermée (il faudrait Firebase
  Cloud Messaging + une Cloud Function). Les notifications fonctionnent quand
  KUMA est ouvert en arrière-plan (menu ⋮ → Notifications).
- Messages non chiffrés de bout en bout (protégés par les règles Firebase).
- Appels de groupe en maillage : confortables jusqu'à 5–6 participants.
- Icônes générées : remplacez les fichiers du dossier `icons/` par votre logo
  (mêmes noms, mêmes tailles) si vous en avez un.
