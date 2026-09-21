# PornScout

[English version](README_EN.md)

PornScout est un userscript pour **Tampermonkey / Violentmonkey** qui intercepte les téléchargements `.torrent`, analyse la release courante, recherche éventuellement de meilleures versions sur d’autres trackers et permet de les envoyer vers un ou plusieurs clients BitTorrent.

PornScout n’est ni un client BitTorrent, ni un tracker, ni un indexeur centralisé.

## Captures

<table>
<tr>
<td width="50%" align="center"><strong>Configuration</strong><br><img src="assets/screenshots/configuration.png" alt="Configuration PornScout"></td>
<td width="50%" align="center"><strong>Recherche et sélection</strong><br><img src="assets/screenshots/quality-search.png" alt="Recherche PornScout"></td>
</tr>
<tr>
<td colspan="2" align="center"><strong>Envoi vers qBitTorrent avec tag PornScout</strong><br><img src="assets/screenshots/qbittorrent.png" alt="PornScout dans qBitTorrent" width="680"></td>
</tr>
</table>

## Fonctionnalités

- Interception des téléchargements `.torrent`.
- Analyse de la résolution et seuil minimum configurable.
- Recherche de releases alternatives sur plusieurs trackers.
- Détection, lorsque disponible, de la résolution, taille, codec, source et du nombre de seeders.
- Comparaison avec les contenus déjà présents dans les clients BitTorrent.
- Plusieurs clients et plusieurs instances du même client configurables en parallèle.
- Client par défaut + choix manuel de la destination lors d’un envoi.
- Préférences d’upgrade : résolution, taille maximale optionnelle, codecs, sources et seeders minimum.
- Catégories / tags / labels statiques ou dynamiques (`PornScout`, tracker, résolution, codec, source).
- Trackers activables individuellement.
- Interface FR / EN et mode standard / ultrawide.
- Bouton PornScout flottant et déplaçable.
- `Ctrl + clic` conserve le téléchargement normal du navigateur.

## Trackers supportés

- Kufirc
- HappyFappy
- Empornium
- EmParadise
- SexTorrent
- BitPorn
- ExoticaZ

PornScout ne contourne aucune authentification, invitation ou restriction d’accès. Pour utiliser un tracker privé, vous devez disposer d’un compte valide, y avoir accès et être connecté dans le navigateur où PornScout est installé.

## Clients BitTorrent

- qBitTorrent
- rTorrent / ruTorrent
- Transmission
- Deluge
- Flood

Plusieurs profils peuvent être configurés simultanément, y compris plusieurs instances du même logiciel.

## Installation

1. Installez **Tampermonkey** ou **Violentmonkey**.
2. Ouvrez [PornScout.user.js en version Raw](https://raw.githubusercontent.com/Aerya/PornScout/main/PornScout.user.js).
3. Installez le userscript.
4. Ouvrez la configuration PornScout.
5. Ajoutez au moins un client BitTorrent et activez les trackers utilisés.

## Configuration

La popup permet de régler les clients BitTorrent, la destination par défaut, les catégories/tags/labels, les trackers actifs, la résolution minimale, les préférences d’upgrade, les tags automatiques, la langue et le mode ultrawide.

## Confidentialité et sécurité

PornScout n’utilise aucun service cloud propre. Les requêtes vont uniquement vers les trackers utilisés et les clients BitTorrent configurés. Les informations de connexion sont conservées localement par le gestionnaire de userscripts.

Ne publiez jamais dans une issue une API key, un cookie, une passkey, un token, un mot de passe ou une URL privée contenant un secret.

## Projet lié

### MiniVid

[MiniVid](https://github.com/Aerya/MiniVid) est un indexeur et lecteur vidéo auto-hébergeable pour votre vidéothèque adulte.
