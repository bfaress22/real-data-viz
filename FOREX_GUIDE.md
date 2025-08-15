# Guide d'Utilisation Forex

## Fonctionnalité d'Inversion des Paires de Devises

Cette application est spécialement conçue pour l'analyse forex et permet d'inverser facilement les paires de devises.

### Comment ça marche

#### 1. **Colonnes avec noms automatiques** (détection automatique)
Si vos colonnes sont nommées au format standard :
- `USD/MAD`, `EUR/USD`, `GBP/JPY` (format slash)
- `USDMAD`, `EURUSD`, `GBPJPY` (format direct)

➜ **Action** : L'application détecte automatiquement ces paires et propose l'inversion

#### 2. **Colonnes avec noms quelconques** (manuel)
Si vos colonnes ont des noms génériques comme :
- `Price`, `Close`, `Rate`, `Value`, `Open`, `High`, `Low`

➜ **Action** : 
1. Sélectionnez la colonne à inverser
2. Spécifiez la paire forex qu'elle représente (ex: `USD/MAD`)
3. Cliquez sur le bouton d'inversion
4. La colonne devient `MAD/USD` avec les valeurs inversées (1/valeur)

### Exemples d'utilisation

#### Cas 1 : Fichier CSV avec colonnes nommées
```csv
Date,EUR/USD,USD/MAD,GBP/USD
2024-01-01,1.1045,9.8350,1.2685
```
✅ **Détection automatique** → Boutons d'inversion disponibles immédiatement

#### Cas 2 : Fichier CSV avec colonnes génériques
```csv
Date,Price,Rate,Close
2024-01-01,1.1045,9.8350,1.2685
```
✅ **Configuration manuelle** :
- Colonne : `Price` → Paire : `EUR/USD` → Résultat : `USD/EUR`
- Colonne : `Rate` → Paire : `USD/MAD` → Résultat : `MAD/USD`

### Interface utilisateur

1. **Importez votre dataset** 
2. **Section "Gestion des Paires Forex"** apparaît
3. **Deux modes disponibles** :
   - **Automatique** : Pour les paires détectées
   - **Manuel** : Sélection colonne + saisie paire
4. **Inversion en un clic** avec aperçu du résultat

### Formule mathématique

```
Si USD/MAD = 9.8350
Alors MAD/USD = 1 / 9.8350 = 0.1017
```

### Cas d'usage typique

**Objectif** : Analyser comment MAD/USD varie en fonction de EUR/USD

**Étapes** :
1. Importer données avec `EUR/USD` et `USD/MAD`
2. Inverser `USD/MAD` → `MAD/USD`
3. Utiliser `EUR/USD` comme variable X
4. Utiliser `MAD/USD` comme variable Y
5. Lancer l'analyse de régression

### Formats supportés

- **Paires avec slash** : `USD/MAD` → `MAD/USD`
- **Paires directes** : `USDMAD` → `MADUSD`
- **Saisie manuelle** : Accepte les deux formats

Cette fonctionnalité simplifie grandement l'analyse des corrélations entre paires de devises dans le trading forex !
