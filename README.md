# Chef de projet formation : dans le vif du sujet

Simulateur e-learning de pilotage de projet de formation, conçu pour l'IFAP (Nouvelle-Calédonie) et la plateforme LIANE.
Public : chefs de projet et coordinateurs de formation de l'IFAP. Durée : 45 à 50 min.

Le simulateur suit le processus IFAP : sollicitation → étude du besoin → engagement → réalisation → évaluation → capitalisation, avec trois portes de décision GO / NO-GO.

## Démarrage rapide

Ouvrir `index.html` dans un navigateur. Aucun serveur, aucune dépendance : tout est embarqué (CSS, JS, polices, portraits).

Publication avec GitHub Pages : *Settings → Pages → Deploy from a branch → `main` / root*.

## Structure

```
index.html            Version tout-en-un générée (ne pas modifier à la main)
build.py              Assemble src/ en index.html (polices et images en base64)
src/
  css/style.css       Charte IFAP/LIANE, mise en page « bureau de projet »
  js/content.js       Tous les textes : sections, décisions, portes, crises, rapport
  js/interactions.js  Moteur : jauges, effets domino, effets différés, crises, portes, rapport
  fonts/              Fraunces, Inter, JetBrains Mono (SIL Open Font License)
  images/             Portraits des personnages
```

## Modifier le contenu

1. Éditer `src/js/content.js` (textes, effets des décisions, conditions des portes).
2. Lancer `python3 build.py`.
3. Ouvrir `index.html` pour vérifier.

Effets : `budget` = Ressources, `delai` = Délai, `qualite` = Pertinence, `confiance` = Confiance employeur (jauge cachée).

## Mécaniques

- 3 jauges visibles + 1 jauge cachée révélée dans le rapport final.
- Effets différés, effets domino (seuils 40 / 30 / 20 / 30), crises sous 25, incidents à 0, 2 recharges maximum par jauge.
- Portes GO / NO-GO : passer avec un point bloquant pénalise ; un NO-GO justifié corrige et annule l'effet différé correspondant.
- État conservé en `sessionStorage` (clés : `scenarioChoice`, `budget`, `delai`, `qualite`, `confiance_cmd`, `deferred_impacts`, `decisions_journal`, `incidents`…).

## Licence

Contenu : © IFAP — Creative Commons BY-NC-SA 4.0. Polices : SIL Open Font License.
