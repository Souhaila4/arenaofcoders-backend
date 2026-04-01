# GitHub Scraping - Documentation

## Vue d'ensemble

Le service de scraping GitHub utilise l'API REST publique de GitHub pour récupérer les informations des dépôts utilisateur.

## Fonctionnalités

### Données récupérées pour chaque dépôt :

- **Informations de base** : nom, description, URL
- **Statistiques** : stars, forks, watchers, issues ouvertes, taille
- **Langages** : langage principal + répartition en pourcentages de tous les langages utilisés
- **Topics** : tags/sujets du dépôt
- **License** : type de licence (MIT, Apache, GPL, etc.)
- **Dates** : date de création et dernière mise à jour
- **Dernier commit** : date, message, auteur
- **README** : contenu (limité à 2000 caractères)

## Limites de taux (Rate Limits)

### Sans authentification
- **60 requêtes par heure**
- Suffisant pour un usage basique (signup de quelques utilisateurs/heure)

### Avec authentification (recommandé pour production)
- **5000 requêtes par heure**
- Permet de supporter plus d'utilisateurs simultanés

## Configuration du token GitHub (optionnel mais recommandé)

### 1. Créer un Personal Access Token

1. Allez sur https://github.com/settings/tokens
2. Cliquez sur "Generate new token" → "Generate new token (classic)"
3. Donnez un nom : `ArenaOfCoders Scraping`
4. **Permissions nécessaires** : Aucune permission spéciale requise ! (lecture publique uniquement)
   - Vous pouvez laisser toutes les cases décochées
5. Cliquez sur "Generate token"
6. **Copiez le token** (vous ne pourrez plus le voir après)

### 2. Ajouter le token au fichier .env

```bash
# Dans le fichier .env du backend
GITHUB_TOKEN=ghp_VotreTokenIci123456789abcdef
```

### 3. Redémarrer le backend

```bash
npm run start:dev
```

## Vérification

Les logs au démarrage indiquent si le token est chargé :

```
[ScraperService] GitHub Token: Configured ✓ (Rate limit: 5000/h)
# ou
[ScraperService] GitHub Token: Not configured (Rate limit: 60/h)
```

## Retry Logic

Le service implémente une stratégie de retry automatique :
- **3 tentatives maximum** par requête
- **Exponential backoff** : 1s, 2s, 4s
- Pas de retry sur erreurs 404 ou 403 (user inexistant ou rate limit atteint)

## Sécurité

- Le token GitHub est **optionnel**
- Si configuré, il n'a **aucune permission** (lecture publique uniquement)
- Ne donne accès à **aucune donnée privée**
- Peut être révoqué à tout moment sur GitHub

## Performance

- **Requêtes parallèles** : README, langages et commits récupérés en parallèle
- **Timeouts** : 
  - 10s pour la liste des dépôts
  - 5s par README
  - 5s pour les langages
  - 5s pour les commits
- **Total** : ~15-20 secondes pour scraper 3 dépôts complets

## Affichage sur le profil

Le frontend affiche :
- ⭐ Stars, 👁️ Watchers, 🍴 Forks
- ⚠️ Issues ouvertes
- 🎨 Graphique de répartition des langages
- 📜 Licence
- 💬 Dernier commit (message, auteur, date)
- #️⃣ Topics (tags)
- 📄 README (expandable)

## Monitoring

Pour vérifier le rate limit actuel de GitHub :

```bash
# Sans token
curl https://api.github.com/rate_limit

# Avec token
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/rate_limit
```

## Troubleshooting

### Erreur 403 (Rate Limit Exceeded)

Si vous voyez cette erreur :
1. Attendez 1 heure (reset automatique)
2. Ou configurez un GITHUB_TOKEN pour augmenter la limite

### Erreur 404 (User Not Found)

L'utilisateur GitHub n'existe pas ou l'URL est invalide.

### Timeout

Si le scraping prend trop de temps :
- Vérifiez votre connexion internet
- Le timeout actuel est de 10-15 secondes par dépôt
- Les README très longs sont automatiquement tronqués à 2000 caractères
