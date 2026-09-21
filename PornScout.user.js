// ==UserScript==
// @name         PornScout
// @namespace    aerya-qbit-direct
// @version      3.5.4
// @description  Adult release quality checker, multi-client BitTorrent helper and cross-tracker scout.
// @homepageURL   https://github.com/Aerya/PornScout
// @supportURL    https://github.com/Aerya/PornScout/issues
// @author       Aerya
//
// @match        https://kufirc.com/*
// @match        https://*.kufirc.com/*
// @match        https://sextorrent.myds.me/*
// @match        https://exoticaz.to/*
// @match        https://*.exoticaz.to/*
// @match        https://bitporn.eu/*
// @match        https://*.bitporn.eu/*
// @match        https://happyfappy.net/*
// @match        https://www.happyfappy.net/*
// @match        https://empornium.sx/*
// @match        https://www.empornium.sx/*
// @match        https://emparadise.rs/*
// @match        https://www.emparadise.rs/*
//
// // L'hôte qBitTorrent est configurable : Tampermonkey doit donc autoriser
// // une destination inconnue à l'avance. Les domaines réellement utilisés
// // restent ceux configurés dans la popup et les trackers ci-dessus.
// @connect      *
//
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
//
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    const SCRIPT_VERSION = "3.5.4";
    const STORAGE_KEY = "qbit-direct-config-v2";
    const UI_LANG_KEY = "pornscout-ui-language";
    const CONFIG_VIEW_KEY = "pornscout-config-view";
    const FLOAT_POS_KEY = "pornscout-floating-position";

    const PORNSCOUT_ICON_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"512\" height=\"512\" viewBox=\"0 0 512 512\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#7C3AED\"/><stop offset=\"55%\" stop-color=\"#DB2777\"/><stop offset=\"100%\" stop-color=\"#F97316\"/></linearGradient><filter id=\"s\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\"><feDropShadow dx=\"0\" dy=\"12\" stdDeviation=\"16\" flood-color=\"#000\" flood-opacity=\".22\"/></filter></defs><rect x=\"38\" y=\"38\" width=\"436\" height=\"436\" rx=\"112\" fill=\"#111318\" filter=\"url(#s)\"/><!-- Magnifying-glass / scout motif --><circle cx=\"228\" cy=\"222\" r=\"112\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"34\"/><path d=\"M310 306 L392 388\" stroke=\"url(#g)\" stroke-width=\"34\" stroke-linecap=\"round\"/><!-- PS monogram --><path d=\"M156 302 V146 H226 C276 146 304 171 304 211 C304 252 276 278 226 278 H190\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"28\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M286 170 C272 150 247 140 219 140 C179 140 154 160 154 190 C154 221 181 234 223 243 C264 252 286 263 286 294 C286 329 256 350 213 350 C181 350 154 338 137 316\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"22\" stroke-linecap=\"round\"/></svg>";
    const PORNSCOUT_LOGO_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"320\" viewBox=\"0 0 1200 320\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#7C3AED\"/><stop offset=\"55%\" stop-color=\"#DB2777\"/><stop offset=\"100%\" stop-color=\"#F97316\"/></linearGradient></defs><g transform=\"translate(20,20)\"><rect x=\"0\" y=\"0\" width=\"280\" height=\"280\" rx=\"68\" fill=\"#111318\"/><circle cx=\"124\" cy=\"120\" r=\"66\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"22\"/><path d=\"M174 170 L228 224\" stroke=\"url(#g)\" stroke-width=\"22\" stroke-linecap=\"round\"/><path d=\"M82 171 V76 H126 C158 76 176 92 176 117 C176 143 158 159 126 159 H103\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"18\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M163 92 C154 79 138 72 120 72 C95 72 79 85 79 104 C79 124 96 132 123 138 C149 144 163 151 163 171 C163 193 144 207 117 207 C97 207 79 199 68 185\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"14\" stroke-linecap=\"round\"/></g><text x=\"350\" y=\"150\" font-family=\"Inter,Segoe UI,Arial,sans-serif\" font-size=\"92\" font-weight=\"800\" letter-spacing=\"-2\" fill=\"#111318\">Porn</text><text x=\"606\" y=\"150\" font-family=\"Inter,Segoe UI,Arial,sans-serif\" font-size=\"92\" font-weight=\"800\" letter-spacing=\"-2\" fill=\"url(#g)\">Scout</text><text x=\"354\" y=\"215\" font-family=\"Inter,Segoe UI,Arial,sans-serif\" font-size=\"30\" font-weight=\"500\" fill=\"#565C66\">Find better releases. Skip worse ones.</text></svg>";


    const DEFAULT_CONFIG = {
        // v3.5+: plusieurs profils de clients BitTorrent.
        // Les anciens champs ci-dessous sont conservés uniquement pour migration.
        clients: [],
        defaultClientId: "",

        clientType: "qbittorrent",

        // qBitTorrent
        qbitUrl: "",
        apiKey: "",
        qbitCategory: "",
        qbitTags: "",

        // rTorrent / ruTorrent XML-RPC
        rtorrentUrl: "",
        rtorrentUsername: "",
        rtorrentPassword: "",
        rtorrentLabel: "",

        // Transmission RPC
        transmissionUrl: "",
        transmissionUsername: "",
        transmissionPassword: "",
        transmissionLabels: "",

        // Deluge Web JSON-RPC
        delugeUrl: "",
        delugePassword: "",
        delugeLabel: "",

        // Flood
        floodUrl: "",
        floodUsername: "",
        floodPassword: "",
        floodTags: "",

        // Trackers interrogés
        enabledTrackers: {
            kufirc: true,
            happyfappy: true,
            empornium: true,
            emparadise: true,
            sextorrent: true,
            bitporn: true,
            exoticaz: true
        },

        // Préférences d'upgrade
        upgradeUseMaxSize: false,
        upgradeMaxSizeGiB: 20,
        upgradePreferredCodecs: "",
        upgradePreferredSources: "",
        upgradeUseMinSeeders: false,
        upgradeMinSeeders: 1,

        // Tags / labels automatiques
        dynamicTagsEnabled: true,
        dynamicTagPornScout: true,
        dynamicTagTracker: true,
        dynamicTagResolution: true,
        dynamicTagCodec: false,
        dynamicTagSource: false,

        forceStart: true,
        minimumResolution: 1080,
        warnBelowMinimum: true,
        checkSimilarInQbit: true,
        searchBetterOnTrackers: true,
        showQualitySearchPanel: false,
        debug: false
    };

    const PROVIDERS = [
        {
            id: "kufirc",
            label: "Kufirc",
            base: "https://kufirc.com",
            faviconPage: "https://kufirc.com/",
            engine: "gazelle",
            searchStyle: "gazelle-title"
        },
        {
            id: "happyfappy",
            label: "HappyFappy",
            base: "https://www.happyfappy.net",
            faviconPage: "https://www.happyfappy.net/",
            engine: "gazelle",
            searchStyle: "gazelle-title"
        },
        {
            id: "empornium",
            label: "Empornium",
            base: "https://www.empornium.sx",
            faviconPage: "https://www.empornium.sx/login",
            engine: "gazelle",
            searchStyle: "gazelle-title"
        },
        {
            id: "emparadise",
            label: "EmParadise",
            base: "https://emparadise.rs",
            faviconPage: "https://emparadise.rs/login",
            engine: "gazelle",
            searchStyle: "gazelle-title"
        },
        {
            id: "sextorrent",
            label: "SexTorrent",
            base: "https://sextorrent.myds.me",
            faviconPage: "https://sextorrent.myds.me/",
            engine: "generic",
            searchStyle: "name"
        },
        {
            id: "bitporn",
            label: "BitPorn",
            base: "https://bitporn.eu",
            faviconPage: "https://bitporn.eu/",
            engine: "generic",
            searchStyle: "name"
        },
        {
            id: "exoticaz",
            label: "ExoticaZ",
            base: "https://exoticaz.to",
            faviconPage: "https://exoticaz.to/",
            engine: "generic",
            searchStyle: "exoticaz"
        }
    ];

    function isProviderEnabled(provider, config = CONFIG) {
        return config.enabledTrackers?.[provider.id] !== false;
    }

    function getEnabledProviders(config = CONFIG) {
        return PROVIDERS.filter(provider => isProviderEnabled(provider, config));
    }

    function getProviderForHost(host = location.hostname) {
        const normalized = String(host || "").replace(/^www\./i, "").toLowerCase();

        return PROVIDERS.find(provider => {
            try {
                return new URL(provider.base).hostname
                    .replace(/^www\./i, "")
                    .toLowerCase() === normalized;
            } catch (_) {
                return false;
            }
        }) || null;
    }


    // Runtime state is initialized only after the multi-client helpers/constants.
    // This avoids accessing CLIENT_COLORS / CLIENT_ICONS while they are still
    // in the JavaScript temporal-dead-zone during legacy config migration.
    let CONFIG;
    let UI_LANG;
    let CONFIG_VIEW;

    const I18N = {
        fr: {
            configTitle: "Configuration PornScout",
            configIntro: "Configuration locale du navigateur. Les informations de connexion au client BitTorrent restent dans le stockage local du gestionnaire de userscripts.",
            qbitUrl: "URL de la WebUI qBitTorrent",
            apiKey: "Clé API qBitTorrent ≥ 5.2",
            show: "Afficher",
            hide: "Masquer",
            minimumResolution: "Résolution minimale",
            scriptVersion: "Version du script",
            behavior: "Comportement",
            forceStart: "Démarrer automatiquement après ajout",
            warnLow: "Ne pas envoyer automatiquement si la résolution est inconnue ou inférieure au minimum",
            checkSimilar: "Chercher dans le client BitTorrent le même contenu dans une autre qualité",
            searchTrackers: "Chercher automatiquement une meilleure résolution sur les trackers quand la qualité est insuffisante",
            showPanel: "Afficher le panneau comparatif « meilleure qualité » après analyse",
            debug: "Logs de debug dans la console",
            cancel: "Annuler",
            reset: "Réinitialiser",
            test: "Tester la connexion",
            save: "Enregistrer",
            testing: "Test de connexion…",
            resetConfirm: "Réinitialiser toute la configuration locale de PornScout ?",
            configReset: "Configuration réinitialisée",
            configSaved: "Configuration enregistrée",
            invalidUrl: "✕ Saisis une URL qBitTorrent valide commençant par http:// ou https://",
            apiRequired: "✕ La clé API qBitTorrent est obligatoire.",
            qbitOk: "✓ qBitTorrent {version} accessible et clé API acceptée.",
            floatingTooltip: "PornScout — ouvrir la configuration",
            configMenu: "⚙️ Configurer PornScout",
            testMenu: "🔌 Tester le client BitTorrent",
            language: "Langue",
            clientChoice: "Clients BitTorrent",
            clientSettings: "Connexion au client",
            clientsHelp: "Ajoute autant d’instances que nécessaire. La couleur permet de distinguer plusieurs instances du même client.",
            addClient: "Ajouter un client",
            removeClient: "Supprimer",
            clientName: "Nom du profil",
            clientNamePlaceholder: "ex. qBit maison, Seedbox…",
            clientTypeLabel: "Type",
            clientColor: "Couleur",
            defaultClient: "Client par défaut",
            defaultClientHelp: "Utilisé pour les envois automatiques lorsqu’aucun choix manuel n’est nécessaire.",
            noClient: "Aucun client BitTorrent configuré.",
            floodUrl: "URL Flood",
            floodUsername: "Utilisateur Flood (optionnel si auth désactivée)",
            floodPassword: "Mot de passe Flood (optionnel si auth désactivée)",
            floodTags: "Tags Flood (séparés par des virgules)",
            testAllClients: "Tester les connexions",
            sendToClientTooltip: "Envoyer vers {client}",
            rtorrentUrl: "URL XML-RPC rTorrent (ex. https://serveur/RPC2)",
            rpcUsername: "Utilisateur HTTP (optionnel)",
            rpcPassword: "Mot de passe HTTP (optionnel)",
            transmissionUrl: "URL Transmission (base ou /transmission/rpc)",
            transmissionUsername: "Utilisateur HTTP (optionnel)",
            transmissionPassword: "Mot de passe HTTP (optionnel)",
            delugeUrl: "URL WebUI Deluge (ex. http://serveur:8112)",
            delugePassword: "Mot de passe WebUI Deluge",
            clientRequired: "✕ Complète les paramètres de connexion du client sélectionné.",
            clientOk: "✓ {client} accessible — {version}",
            betterFound: "Une meilleure release a été trouvée. PornScout n’enverra pas automatiquement la version actuelle.",
            sendCurrent: "Envoyer la version actuelle",
            organization: "Organisation (optionnel)",
            qbitCategory: "Catégorie qBitTorrent",
            qbitTags: "Étiquettes qBitTorrent (séparées par des virgules)",
            rtorrentLabel: "Label rTorrent / ruTorrent",
            transmissionLabels: "Labels Transmission (séparés par des virgules)",
            delugeLabel: "Label Deluge (plugin Label requis)",
            githubProject: "Projet GitHub",
            ultrawideMode: "Mode ultrawide",
            standardMode: "Mode standard",
            relatedProject: "Projet lié",
            miniVidPitch: "MiniVid — indexeur et lecteur vidéo pour votre vidéothèque adulte.",
            viewOnGitHub: "Voir sur GitHub",
            goToSearch: "Y aller",
            sendResult: "Envoyer à {client}",
            sendingResult: "Envoi…",
            trackersSection: "Trackers interrogés",
            trackersHelp: "Désactive les trackers auxquels tu n’as pas accès ou que tu ne veux pas interroger.",
            upgradePrefs: "Préférences d’upgrade",
            maxSizeToggle: "Limiter la taille maximale d’une meilleure release",
            maxSizeGiB: "Taille maximale (GiB)",
            codecPrefs: "Codecs préférés — ordre de préférence",
            codecPrefsHelp: "Optionnel. Exemple : AV1, HEVC, AVC. Vide = aucune préférence.",
            sourcePrefs: "Sources préférées — ordre de préférence",
            sourcePrefsHelp: "Optionnel. Exemple : REMUX, WEB-DL, BluRay. Vide = aucune préférence.",
            minSeedersToggle: "Exiger un nombre minimum de seeders",
            minSeeders: "Seeders minimum",
            upgradeHelp: "La résolution reste prioritaire. La taille max et les seeders sont des filtres ; codec et source départagent aussi les releases de même résolution.",
            dynamicTags: "Tags / labels automatiques",
            dynamicTagsEnable: "Ajouter automatiquement des tags / labels",
            dynamicPornScout: "PornScout",
            dynamicTracker: "Tracker source",
            dynamicResolution: "Résolution",
            dynamicCodec: "Codec",
            dynamicSource: "Source",
            seedersLabel: "{count} seeders",
            excludedByPrefs: "hors préférences d’upgrade"
        },
        en: {
            configTitle: "PornScout Settings",
            configIntro: "Local browser configuration. BitTorrent client connection details stay in the userscript manager local storage.",
            qbitUrl: "qBitTorrent WebUI URL",
            apiKey: "qBitTorrent API key ≥ 5.2",
            show: "Show",
            hide: "Hide",
            minimumResolution: "Minimum resolution",
            scriptVersion: "Script version",
            behavior: "Behavior",
            forceStart: "Start automatically after adding",
            warnLow: "Do not send automatically when resolution is unknown or below the minimum",
            checkSimilar: "Search the BitTorrent client for the same content in another quality",
            searchTrackers: "Automatically search trackers for a better resolution when quality is too low",
            showPanel: "Show the “better quality” comparison panel after analysis",
            debug: "Debug logs in the console",
            cancel: "Cancel",
            reset: "Reset",
            test: "Test connection",
            save: "Save",
            testing: "Testing connection…",
            resetConfirm: "Reset all local PornScout settings?",
            configReset: "Configuration reset",
            configSaved: "Configuration saved",
            invalidUrl: "✕ Enter a valid qBitTorrent URL starting with http:// or https://",
            apiRequired: "✕ The qBitTorrent API key is required.",
            qbitOk: "✓ qBitTorrent {version} is reachable and the API key was accepted.",
            floatingTooltip: "PornScout — open settings",
            configMenu: "⚙️ Configure PornScout",
            testMenu: "🔌 Test BitTorrent client",
            language: "Language",
            clientChoice: "BitTorrent clients",
            clientSettings: "Client connection",
            clientsHelp: "Add as many instances as needed. The color helps distinguish multiple instances of the same client.",
            addClient: "Add client",
            removeClient: "Remove",
            clientName: "Profile name",
            clientNamePlaceholder: "e.g. Home qBit, Seedbox…",
            clientTypeLabel: "Type",
            clientColor: "Color",
            defaultClient: "Default client",
            defaultClientHelp: "Used for automatic sends when no manual target selection is required.",
            noClient: "No BitTorrent client configured.",
            floodUrl: "Flood URL",
            floodUsername: "Flood username (optional when auth is disabled)",
            floodPassword: "Flood password (optional when auth is disabled)",
            floodTags: "Flood tags (comma-separated)",
            testAllClients: "Test connections",
            sendToClientTooltip: "Send to {client}",
            rtorrentUrl: "rTorrent XML-RPC URL (e.g. https://server/RPC2)",
            rpcUsername: "HTTP username (optional)",
            rpcPassword: "HTTP password (optional)",
            transmissionUrl: "Transmission URL (base or /transmission/rpc)",
            transmissionUsername: "HTTP username (optional)",
            transmissionPassword: "HTTP password (optional)",
            delugeUrl: "Deluge WebUI URL (e.g. http://server:8112)",
            delugePassword: "Deluge WebUI password",
            clientRequired: "✕ Complete the connection settings for the selected client.",
            clientOk: "✓ {client} reachable — {version}",
            betterFound: "A better release was found. PornScout will not automatically send the current version.",
            sendCurrent: "Send current version",
            organization: "Organization (optional)",
            qbitCategory: "qBitTorrent category",
            qbitTags: "qBitTorrent tags (comma-separated)",
            rtorrentLabel: "rTorrent / ruTorrent label",
            transmissionLabels: "Transmission labels (comma-separated)",
            delugeLabel: "Deluge label (Label plugin required)",
            githubProject: "GitHub project",
            ultrawideMode: "Ultrawide mode",
            standardMode: "Standard mode",
            relatedProject: "Related project",
            miniVidPitch: "MiniVid — a video indexer and player for your adult video library.",
            viewOnGitHub: "View on GitHub",
            goToSearch: "Go",
            sendResult: "Send to {client}",
            sendingResult: "Sending…",
            trackersSection: "Trackers to query",
            trackersHelp: "Disable trackers you cannot access or do not want PornScout to query.",
            upgradePrefs: "Upgrade preferences",
            maxSizeToggle: "Limit the maximum size of a better release",
            maxSizeGiB: "Maximum size (GiB)",
            codecPrefs: "Preferred codecs — preference order",
            codecPrefsHelp: "Optional. Example: AV1, HEVC, AVC. Empty = no preference.",
            sourcePrefs: "Preferred sources — preference order",
            sourcePrefsHelp: "Optional. Example: REMUX, WEB-DL, BluRay. Empty = no preference.",
            minSeedersToggle: "Require a minimum number of seeders",
            minSeeders: "Minimum seeders",
            upgradeHelp: "Resolution stays the primary criterion. Max size and seeders are filters; codec and source can also improve a same-resolution release.",
            dynamicTags: "Automatic tags / labels",
            dynamicTagsEnable: "Automatically add tags / labels",
            dynamicPornScout: "PornScout",
            dynamicTracker: "Source tracker",
            dynamicResolution: "Resolution",
            dynamicCodec: "Codec",
            dynamicSource: "Source",
            seedersLabel: "{count} seeders",
            excludedByPrefs: "outside upgrade preferences"
        }
    };

    function t(key, vars = {}) {
        let value = I18N[UI_LANG]?.[key] ?? I18N.fr[key] ?? key;
        for (const [name, replacement] of Object.entries(vars)) {
            value = value.replaceAll(`{${name}}`, String(replacement));
        }
        return value;
    }

    function svgToDataUri(svg) {
        return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }


    // ============================================================
    // CONFIGURATION
    // ============================================================

    const CLIENT_COLORS = [
        "#60a5fa",
        "#f97316",
        "#a78bfa",
        "#22c55e",
        "#ef4444",
        "#06b6d4",
        "#e879f9",
        "#facc15"
    ];

    const CLIENT_ICONS = {
        qbittorrent: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/qbittorrent.svg",
        rtorrent: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/rutorrent.svg",
        transmission: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/transmission.svg",
        deluge: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/deluge.svg",
        flood: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/flood.svg"
    };

    function makeClientId() {
        if (globalThis.crypto?.randomUUID) {
            return globalThis.crypto.randomUUID();
        }

        return "client-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
    }

    function normalizeBaseUrl(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function normalizeRpcUrl(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function normalizeTransmissionUrl(value) {
        const raw = String(value || "").trim().replace(/\/+$/, "");
        if (!raw) return "";

        if (/\/transmission\/rpc$/i.test(raw)) {
            return raw;
        }

        return raw + "/transmission/rpc";
    }

    function createClientProfile(type = "qbittorrent", index = 0) {
        return {
            id: makeClientId(),
            name: "",
            clientType: type,
            color: CLIENT_COLORS[index % CLIENT_COLORS.length],

            qbitUrl: "",
            apiKey: "",
            qbitCategory: "",
            qbitTags: "",

            rtorrentUrl: "",
            rtorrentUsername: "",
            rtorrentPassword: "",
            rtorrentLabel: "",

            transmissionUrl: "",
            transmissionUsername: "",
            transmissionPassword: "",
            transmissionLabels: "",

            delugeUrl: "",
            delugePassword: "",
            delugeLabel: "",

            floodUrl: "",
            floodUsername: "",
            floodPassword: "",
            floodTags: ""
        };
    }

    function normalizeClientProfile(profile = {}, index = 0) {
        const base = createClientProfile(profile.clientType || "qbittorrent", index);

        return {
            ...base,
            ...profile,
            id: String(profile.id || base.id),
            clientType: getClientType(profile),
            color: /^#[0-9a-f]{6}$/i.test(String(profile.color || ""))
                ? profile.color
                : CLIENT_COLORS[index % CLIENT_COLORS.length],

            qbitUrl: normalizeBaseUrl(profile.qbitUrl || ""),
            rtorrentUrl: normalizeRpcUrl(profile.rtorrentUrl || ""),
            transmissionUrl: normalizeTransmissionUrl(profile.transmissionUrl || ""),
            delugeUrl: normalizeBaseUrl(profile.delugeUrl || ""),
            floodUrl: normalizeBaseUrl(profile.floodUrl || "")
        };
    }

    function legacyClientProfile(parsed) {
        const type = getClientType(parsed);

        const candidate = normalizeClientProfile({
            id: "legacy-" + type,
            name: "",
            clientType: type,
            color: CLIENT_COLORS[0],

            qbitUrl: parsed.qbitUrl,
            apiKey: parsed.apiKey,
            qbitCategory: parsed.qbitCategory,
            qbitTags: parsed.qbitTags,

            rtorrentUrl: parsed.rtorrentUrl,
            rtorrentUsername: parsed.rtorrentUsername,
            rtorrentPassword: parsed.rtorrentPassword,
            rtorrentLabel: parsed.rtorrentLabel,

            transmissionUrl: parsed.transmissionUrl,
            transmissionUsername: parsed.transmissionUsername,
            transmissionPassword: parsed.transmissionPassword,
            transmissionLabels: parsed.transmissionLabels,

            delugeUrl: parsed.delugeUrl,
            delugePassword: parsed.delugePassword,
            delugeLabel: parsed.delugeLabel,

            floodUrl: parsed.floodUrl,
            floodUsername: parsed.floodUsername,
            floodPassword: parsed.floodPassword,
            floodTags: parsed.floodTags
        });

        return hasClientConfig(candidate) ? candidate : null;
    }

    function normalizeStoredConfig(parsed = {}) {
        let clients = Array.isArray(parsed.clients)
            ? parsed.clients.map(normalizeClientProfile)
            : [];

        if (!clients.length) {
            const migrated = legacyClientProfile(parsed);
            if (migrated) clients = [migrated];
        }

        const defaultClientId =
            clients.some(client => client.id === parsed.defaultClientId)
                ? parsed.defaultClientId
                : (clients[0]?.id || "");

        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            clients,
            defaultClientId,
            enabledTrackers: {
                ...DEFAULT_CONFIG.enabledTrackers,
                ...(parsed.enabledTrackers || {})
            }
        };
    }

    function loadConfig() {
        const stored = GM_getValue(STORAGE_KEY, null);

        if (!stored) {
            return normalizeStoredConfig(DEFAULT_CONFIG);
        }

        try {
            const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
            return normalizeStoredConfig(parsed);
        } catch (error) {
            console.warn("[PornScout] Configuration invalide, valeurs par défaut utilisées", error);
            return normalizeStoredConfig(DEFAULT_CONFIG);
        }
    }

    function saveConfig(next) {
        CONFIG = normalizeStoredConfig({
            ...CONFIG,
            ...next,
            clients: Array.isArray(next.clients)
                ? next.clients.map(normalizeClientProfile)
                : CONFIG.clients
        });

        GM_setValue(STORAGE_KEY, JSON.stringify(CONFIG));
    }

    function getClientType(config = {}) {
        const allowed = ["qbittorrent", "rtorrent", "transmission", "deluge", "flood"];
        return allowed.includes(config.clientType) ? config.clientType : "qbittorrent";
    }

    function getClientLabel(config = {}) {
        switch (getClientType(config)) {
            case "rtorrent": return "rTorrent / ruTorrent";
            case "transmission": return "Transmission";
            case "deluge": return "Deluge";
            case "flood": return "Flood";
            default: return "qBitTorrent";
        }
    }

    function getClientDisplayName(config = {}) {
        const explicit = String(config.name || "").trim();
        return explicit || getClientLabel(config);
    }

    function clientIconUrl(config = {}) {
        return CLIENT_ICONS[getClientType(config)] || CLIENT_ICONS.qbittorrent;
    }

    function hasClientConfig(config = {}) {
        switch (getClientType(config)) {
            case "rtorrent":
                return Boolean(normalizeRpcUrl(config.rtorrentUrl));
            case "transmission":
                return Boolean(normalizeTransmissionUrl(config.transmissionUrl));
            case "deluge":
                return Boolean(normalizeBaseUrl(config.delugeUrl) && String(config.delugePassword || "").trim());
            case "flood":
                return Boolean(normalizeBaseUrl(config.floodUrl));
            default:
                return Boolean(normalizeBaseUrl(config.qbitUrl) && String(config.apiKey || "").trim());
        }
    }

    function hasQbitConfig(config = {}) {
        return getClientType(config) === "qbittorrent" && hasClientConfig(config);
    }

    function getClientProfiles(config = CONFIG) {
        return (Array.isArray(config.clients) ? config.clients : [])
            .map(normalizeClientProfile)
            .filter(hasClientConfig);
    }

    function hasAnyClientConfig(config = CONFIG) {
        return getClientProfiles(config).length > 0;
    }

    function getClientById(id, config = CONFIG) {
        return getClientProfiles(config).find(client => client.id === id) || null;
    }

    function getDefaultClientProfile(config = CONFIG) {
        const clients = getClientProfiles(config);

        return (
            clients.find(client => client.id === config.defaultClientId) ||
            clients[0] ||
            null
        );
    }

    function clientRuntimeConfig(profile, baseConfig = CONFIG) {
        return {
            ...baseConfig,
            ...profile,
            clientType: getClientType(profile)
        };
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunk = 0x8000;

        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }

        return btoa(binary);
    }

    function utf8ToBase64(value) {
        const bytes = new TextEncoder().encode(String(value || ""));
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
    }

    function basicAuthHeaders(username, password) {
        if (!username) return {};
        return {
            Authorization: "Basic " + utf8ToBase64(`${username}:${password || ""}`)
        };
    }

    // Initialize runtime state only now: all config migration helpers,
    // CLIENT_COLORS and CLIENT_ICONS are defined above.
    CONFIG = loadConfig();
    UI_LANG = GM_getValue(UI_LANG_KEY, "fr") === "en" ? "en" : "fr";
    CONFIG_VIEW = GM_getValue(CONFIG_VIEW_KEY, "standard") === "ultrawide"
        ? "ultrawide"
        : "standard";

    function assertPornScoutRuntime() {
        const requiredFunctions = {
            releasePassesUpgradeFilters,
            compareReleasePreference,
            sortUpgradeResults,
            findBetterTrackerResults
        };

        for (const [name, fn] of Object.entries(requiredFunctions)) {
            if (typeof fn !== "function") {
                throw new Error(`PornScout runtime incomplet : ${name} manquant`);
            }
        }
    }

    function log(...args) {
        if (CONFIG.debug) {
            console.log("[PornScout]", ...args);
        }
    }

    // ============================================================
    // UTILITAIRES UI
    // ============================================================

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function ensureStyles() {
        if (document.getElementById("qbd-style")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "qbd-style";
        style.textContent = `
            .qbd-overlay {
                --qbd-bg: #202532;
                --qbd-surface: #293041;
                --qbd-surface-2: #31394c;
                --qbd-surface-3: #394359;
                --qbd-border: #505d78;
                --qbd-text: #f1f5fb;
                --qbd-muted: #b5bfd0;
                --qbd-accent: #8b5cf6;
                --qbd-accent-hover: #7c3aed;
                --qbd-success: #10b981;
                --qbd-warning: #f59e0b;
                --qbd-danger: #ef4444;

                position: fixed;
                inset: 0;
                z-index: 2147483646;
                background: rgba(7, 10, 18, .72);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                color: var(--qbd-text);
            }

            .qbd-modal,
            .qbd-modal * {
                box-sizing: border-box;
            }

            .qbd-modal {
                width: min(880px, calc(100vw - 36px));
                max-width: calc(100vw - 36px);
                max-height: 92vh;
                overflow-y: auto;
                overflow-x: hidden;
                overscroll-behavior: contain;

                background: var(--qbd-bg);
                color: var(--qbd-text);
                border: 1px solid var(--qbd-border);
                border-radius: 16px;
                box-shadow: 0 24px 80px rgba(0,0,0,.55);
                padding: 20px;
            }

            .qbd-modal.qbd-ultrawide {
                width: min(1480px, calc(100vw - 42px));
                max-width: calc(100vw - 42px);
                max-height: 96vh;
            }

            .qbd-brand {
                display: grid;
                grid-template-columns: minmax(150px, 1fr) auto minmax(150px, 1fr);
                align-items: center;
                gap: 16px;
                margin-bottom: 14px;
                min-width: 0;
            }

            .qbd-header-left,
            .qbd-header-right {
                display: flex;
                gap: 7px;
                align-items: center;
                min-width: 0;
            }

            .qbd-header-left {
                justify-content: flex-start;
            }

            .qbd-header-right {
                justify-content: flex-end;
            }

            .qbd-brand-logo-panel {
                display: flex;
                align-items: center;
                justify-content: center;
                width: min(520px, 46vw);
                min-width: 320px;
                padding: 9px 18px;
                border-radius: 12px;
                border: 1px solid #d8d4e6;
                background:
                    linear-gradient(135deg, #ffffff 0%, #f4f0ff 60%, #eee9ff 100%);
                box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
                overflow: hidden;
            }

            .qbd-brand-logo {
                display: block;
                width: min(360px, 100%);
                max-width: 100%;
                height: auto;
                margin: 0 auto;
            }

            .qbd-lang-switch {
                display: flex;
                gap: 6px;
                align-items: center;
            }

            .qbd-lang-btn,
            .qbd-header-icon-btn {
                appearance: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 38px;
                height: 38px;
                padding: 0;
                border: 1px solid var(--qbd-border);
                background: var(--qbd-surface);
                color: var(--qbd-text);
                border-radius: 9px;
                cursor: pointer;
                line-height: 1;
                text-decoration: none;
                transition: border-color .15s, background .15s, transform .08s;
            }

            .qbd-lang-btn {
                font-size: 19px;
                opacity: .72;
            }

            .qbd-lang-btn:hover,
            .qbd-header-icon-btn:hover {
                border-color: var(--qbd-accent);
                background: var(--qbd-surface-2);
                text-decoration: none;
            }

            .qbd-lang-btn:active,
            .qbd-header-icon-btn:active {
                transform: scale(.96);
            }

            .qbd-lang-btn.qbd-active,
            .qbd-header-icon-btn.qbd-active {
                opacity: 1;
                border-color: var(--qbd-accent);
                box-shadow: 0 0 0 2px rgba(139,92,246,.22);
                background: rgba(139,92,246,.14);
            }

            .qbd-header-icon-btn {
                position: relative;
            }

            .qbd-header-icon-btn svg {
                width: 20px;
                height: 20px;
                fill: currentColor;
                stroke: currentColor;
            }

            .qbd-github-badge {
                position: absolute;
                right: -4px;
                bottom: -4px;
                min-width: 17px;
                height: 17px;
                padding: 0 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                background: var(--qbd-accent);
                color: #fff;
                border: 2px solid var(--qbd-bg);
                font-size: 8px;
                font-weight: 800;
                line-height: 1;
                letter-spacing: -.02em;
            }

            .qbd-modal h2 {
                margin: 0 0 7px;
                font-size: 21px;
                color: var(--qbd-text);
            }

            .qbd-modal h3 {
                margin: 20px 0 9px;
                font-size: 15px;
                color: var(--qbd-text);
            }

            .qbd-muted {
                color: var(--qbd-muted);
                opacity: 1;
                font-size: 13px;
                line-height: 1.45;
            }

            .qbd-config-columns {
                display: block;
                min-width: 0;
            }

            .qbd-config-column {
                min-width: 0;
            }

            .qbd-modal.qbd-ultrawide .qbd-config-columns {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 0 28px;
                align-items: start;
            }

            .qbd-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 12px;
                min-width: 0;
            }

            .qbd-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
                min-width: 0;
            }

            .qbd-field-full {
                grid-column: 1 / -1;
            }

            .qbd-field label {
                font-size: 12px;
                font-weight: 700;
                color: #d9e0ec;
            }

            .qbd-field input[type="text"],
            .qbd-field input[type="password"],
            .qbd-field input[type="number"],
            .qbd-field select {
                box-sizing: border-box;
                width: 100%;
                min-width: 0;
                max-width: 100%;
                padding: 10px 11px;
                border-radius: 8px;
                border: 1px solid var(--qbd-border);
                background: var(--qbd-surface);
                color: var(--qbd-text);
                outline: none;
            }

            .qbd-field input:focus,
            .qbd-field select:focus {
                border-color: var(--qbd-accent);
                box-shadow: 0 0 0 3px rgba(139,92,246,.16);
            }

            .qbd-field input:disabled {
                opacity: .55;
                cursor: not-allowed;
            }

            .qbd-client-picker {
                display: flex;
                flex-wrap: wrap;
                gap: 8px 14px;
                width: 100%;
                max-width: 100%;
                margin: 10px 0 16px;
                padding: 11px 12px;
                border-radius: 10px;
                background: var(--qbd-surface);
                border: 1px solid var(--qbd-border);
                overflow: hidden;
            }

            .qbd-client-picker label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                min-width: 0;
                cursor: pointer;
                font-size: 13px;
                font-weight: 700;
                color: var(--qbd-text);
            }

            .qbd-client-picker input[type="radio"] {
                accent-color: var(--qbd-accent);
            }

            .qbd-client-config[hidden] {
                display: none !important;
            }

            /* Simple native-style checkboxes: clearer and more robust in userscripts. */
            .qbd-switch-row {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 9px;
                min-width: 0;
                padding: 6px 0;
                font-size: 13px;
                color: var(--qbd-text);
                cursor: pointer;
            }

            .qbd-switch-row > span:first-child {
                flex: 0 1 auto;
                min-width: 0;
                order: 2;
            }

            .qbd-switch-row > span:last-child {
                order: 1;
                position: static;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: auto;
                height: auto;
                flex: 0 0 auto;
            }

            .qbd-switch-input {
                -webkit-appearance: auto;
                appearance: auto;
                position: static;
                opacity: 1;
                width: 17px;
                min-width: 17px;
                height: 17px;
                margin: 0;
                accent-color: var(--qbd-accent);
                cursor: pointer;
            }

            .qbd-switch {
                display: none !important;
            }

            .qbd-tracker-toggle-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 2px 14px;
                margin: 8px 0 14px;
                min-width: 0;
            }

            .qbd-pref-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px 12px;
                min-width: 0;
            }

            .qbd-pref-hint {
                color: var(--qbd-muted);
                font-size: 11px;
                line-height: 1.35;
                margin-top: 4px;
            }

            .qbd-inline-pref {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(100px, 150px);
                gap: 12px;
                align-items: center;
                min-width: 0;
            }

            .qbd-dynamic-tag-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 2px 14px;
                margin-top: 6px;
                min-width: 0;
            }

            .qbd-footer-links {
                display: grid;
                gap: 8px;
                margin-top: 16px;
                min-width: 0;
            }

            .qbd-project-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                min-width: 0;
                padding: 10px 12px;
                border-radius: 9px;
                border: 1px solid var(--qbd-border);
                background: var(--qbd-surface);
                color: var(--qbd-text);
                text-decoration: none;
            }

            .qbd-project-link:hover {
                border-color: var(--qbd-accent);
                background: var(--qbd-surface-2);
                text-decoration: none;
            }

            .qbd-project-link strong {
                display: block;
                font-size: 13px;
            }

            .qbd-project-link small {
                display: block;
                margin-top: 2px;
                color: var(--qbd-muted);
                font-size: 11px;
                line-height: 1.35;
                overflow-wrap: anywhere;
            }

            .qbd-project-arrow {
                color: #c4b5fd;
                font-size: 18px;
                flex: 0 0 auto;
            }

            @media (max-width: 760px) {
                .qbd-overlay {
                    padding: 8px;
                }

                .qbd-modal,
                .qbd-modal.qbd-ultrawide {
                    width: calc(100vw - 16px);
                    max-width: calc(100vw - 16px);
                    max-height: 96vh;
                    padding: 14px;
                }

                .qbd-brand {
                    grid-template-columns: 1fr;
                    gap: 9px;
                }

                .qbd-header-left,
                .qbd-header-right {
                    justify-content: center;
                }

                .qbd-brand-logo-panel {
                    grid-row: 1;
                    width: 100%;
                    min-width: 0;
                    padding: 7px 9px;
                }

                .qbd-header-left {
                    grid-row: 2;
                }

                .qbd-header-right {
                    grid-row: 3;
                    flex-wrap: wrap;
                }

                .qbd-grid,
                .qbd-tracker-toggle-grid,
                .qbd-pref-grid,
                .qbd-dynamic-tag-grid,
                .qbd-modal.qbd-ultrawide .qbd-config-columns {
                    grid-template-columns: 1fr;
                }

                .qbd-field-full {
                    grid-column: 1;
                }

                .qbd-inline-pref {
                    grid-template-columns: 1fr;
                }
            }
            #pornscout-floating-button {
                position: fixed;
                z-index: 2147483645;
                width: 52px;
                height: 52px;
                padding: 0;
                border: 0;
                border-radius: 15px;
                background: transparent;
                box-shadow: 0 6px 20px rgba(0,0,0,.28);
                cursor: grab;
                user-select: none;
                touch-action: none;
            }
            #pornscout-floating-button:active {
                cursor: grabbing;
            }
            #pornscout-floating-button img {
                width: 100%;
                height: 100%;
                display: block;
                pointer-events: none;
            }
            .qbd-modal h3 {
                margin: 18px 0 8px;
                font-size: 15px;
            }
            .qbd-muted {
                opacity: .72;
                font-size: 13px;
                line-height: 1.45;
            }
            .qbd-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .qbd-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .qbd-field-full {
                grid-column: 1 / -1;
            }
            .qbd-field label {
                font-size: 12px;
                font-weight: 700;
                opacity: .9;
            }
            .qbd-field input[type="text"],
            .qbd-field input[type="password"],
            .qbd-field input[type="number"],
            .qbd-field select {
                box-sizing: border-box;
                width: 100%;
                padding: 10px 11px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,.16);
                background: #111317;
                color: #fff;
                outline: none;
            }
            .qbd-check {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 8px 0;
                font-size: 13px;
            }
            .qbd-switch-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
                padding: 8px 0;
                font-size: 13px;
                cursor: pointer;
            }
            .qbd-switch-row > span:first-child { flex: 1; }
            .qbd-switch-input {
                position: absolute;
                opacity: 0;
                pointer-events: none;
            }
            .qbd-switch {
                position: relative;
                width: 42px;
                height: 24px;
                flex: 0 0 42px;
                border-radius: 999px;
                background: #555b66;
                transition: background .18s ease;
                box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
            }
            .qbd-switch::after {
                content: "";
                position: absolute;
                width: 18px;
                height: 18px;
                top: 3px;
                left: 3px;
                border-radius: 50%;
                background: #fff;
                box-shadow: 0 1px 4px rgba(0,0,0,.35);
                transition: transform .18s ease;
            }
            .qbd-switch-input:checked + .qbd-switch {
                background: #168a54;
            }
            .qbd-switch-input:checked + .qbd-switch::after {
                transform: translateX(18px);
            }
            .qbd-switch-input:focus-visible + .qbd-switch {
                outline: 2px solid #83b5ff;
                outline-offset: 2px;
            }
            .qbd-footer-links {
                display: grid;
                gap: 8px;
                margin-top: 16px;
            }
            .qbd-project-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 12px;
                border-radius: 9px;
                border: 1px solid rgba(255,255,255,.10);
                background: rgba(255,255,255,.035);
                color: #f5f5f5;
                text-decoration: none;
            }
            .qbd-project-link:hover {
                background: rgba(255,255,255,.065);
            }
            .qbd-project-link strong {
                display: block;
                font-size: 13px;
            }
            .qbd-project-link small {
                display: block;
                margin-top: 2px;
                color: rgba(255,255,255,.68);
                font-size: 11px;
                line-height: 1.35;
            }
            .qbd-project-arrow {
                color: #83b5ff;
                font-size: 18px;
                flex: 0 0 auto;
            }
            .qbd-client-picker {
                display: flex;
                flex-wrap: wrap;
                gap: 8px 14px;
                margin: 10px 0 16px;
                padding: 11px 12px;
                border-radius: 10px;
                background: rgba(255,255,255,.035);
                border: 1px solid rgba(255,255,255,.10);
            }
            .qbd-client-picker label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 700;
            }
            .qbd-client-config[hidden] {
                display: none !important;
            }
            .qbd-tracker-toggle-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 4px 14px;
                margin: 8px 0 14px;
            }
            .qbd-pref-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px 12px;
            }
            .qbd-pref-hint {
                color: rgba(255,255,255,.62);
                font-size: 11px;
                line-height: 1.35;
                margin-top: 4px;
            }
            .qbd-inline-pref {
                display: grid;
                grid-template-columns: minmax(0,1fr) 120px;
                gap: 12px;
                align-items: center;
            }
            .qbd-dynamic-tag-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 2px 14px;
                margin-top: 6px;
            }
            @media (max-width: 650px) {
                .qbd-tracker-toggle-grid,
                .qbd-pref-grid,
                .qbd-dynamic-tag-grid {
                    grid-template-columns: 1fr;
                }
                .qbd-inline-pref {
                    grid-template-columns: 1fr;
                }
            }
            .qbd-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 9px;
                justify-content: flex-end;
                margin-top: 18px;
            }
            .qbd-btn {
                appearance: none;
                border: 0;
                border-radius: 8px;
                padding: 9px 13px;
                font-weight: 700;
                cursor: pointer;
                background: var(--qbd-surface-3);
                color: #fff;
            }
            .qbd-btn:hover { filter: brightness(1.12); }
            .qbd-btn-primary { background: var(--qbd-accent); }
            .qbd-btn-danger  { background: #b74646; }
            .qbd-btn-good    { background: #168a54; }
            .qbd-btn-warn    { background: #b87813; }
            .qbd-card {
                border: 1px solid var(--qbd-border);
                background: var(--qbd-surface);
                border-radius: 10px;
                padding: 11px 12px;
                margin: 8px 0;
            }
            .qbd-card strong {
                overflow-wrap: anywhere;
            }
            .qbd-modal img,
            .qbd-modal svg {
                max-width: 100%;
            }
            .qbd-modal a,
            .qbd-modal strong,
            .qbd-modal small,
            .qbd-modal .qbd-muted {
                overflow-wrap: anywhere;
                word-break: normal;
            }
            .qbd-pill {
                display: inline-block;
                border-radius: 999px;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: 800;
                background: rgba(255,255,255,.11);
                margin-right: 5px;
            }
            .qbd-pill-good { background: rgba(54,170,95,.22); color: #a9f2c1; }
            .qbd-pill-warn { background: rgba(214,144,35,.24); color: #ffd48e; }
            .qbd-pill-bad  { background: rgba(205,67,67,.25); color: #ffaaaa; }
            .qbd-overlay .qbd-link,
            .qbd-overlay .qbd-link:visited {
                color: #dbeafe !important;
                text-decoration: none !important;
                overflow-wrap: anywhere;
            }
            .qbd-overlay .qbd-link:hover {
                color: #ffffff !important;
                text-decoration: underline !important;
            }

            .qbd-quality-modal {
                --qbd-bg: #293143;
                --qbd-surface: #333d52;
                --qbd-surface-2: #3b465d;
                --qbd-surface-3: #45516a;
                --qbd-border: #65728e;
                --qbd-muted: #c1cada;
            }

            .qbd-client-profiles {
                display: grid;
                gap: 10px;
                min-width: 0;
            }

            .qbd-client-profile-card {
                border: 1px solid var(--qbd-border);
                background: var(--qbd-surface);
                border-radius: 10px;
                padding: 11px;
                min-width: 0;
            }

            .qbd-client-profile-head {
                display: grid;
                grid-template-columns: auto minmax(130px, 1fr) minmax(150px, .8fr) auto auto;
                gap: 8px;
                align-items: end;
                min-width: 0;
            }

            .qbd-client-profile-icon {
                width: 30px;
                height: 30px;
                object-fit: contain;
                align-self: center;
                border-radius: 6px;
                padding: 3px;
                background: rgba(255,255,255,.92);
            }

            .qbd-client-profile-fields {
                margin-top: 10px;
            }

            .qbd-client-default {
                display: inline-flex;
                gap: 6px;
                align-items: center;
                min-height: 36px;
                font-size: 11px;
                color: var(--qbd-muted);
                white-space: nowrap;
            }

            .qbd-client-default input {
                accent-color: var(--qbd-accent);
            }

            .qbd-client-color {
                width: 38px !important;
                min-width: 38px !important;
                height: 36px;
                padding: 2px !important;
                cursor: pointer;
            }

            .qbd-add-client {
                margin-top: 9px;
            }

            .qbd-release-meta,
            .qbd-current-meta {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 4px;
                margin-bottom: 5px;
            }

            .qbd-client-targets {
                display: inline-flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 5px;
                margin-left: 4px;
            }

            .qbd-client-target {
                --client-color: #8b5cf6;
                appearance: none;
                display: inline-flex;
                align-items: center;
                gap: .32em;
                min-height: 1.6em;
                padding: .15em .48em;
                border-radius: .42em;
                border: 1px solid var(--client-color);
                background: color-mix(in srgb, var(--client-color) 18%, #1f2634);
                color: #f8fafc;
                cursor: pointer;
                vertical-align: middle;
                font: inherit;
                font-size: .92em;
                font-weight: 700;
                line-height: 1.2;
                box-shadow: 0 0 0 1px color-mix(in srgb, var(--client-color) 16%, transparent);
                transition: transform .08s, background .15s, box-shadow .15s;
                white-space: nowrap;
            }

            .qbd-client-target:hover {
                transform: translateY(-1px);
                background: color-mix(in srgb, var(--client-color) 30%, #1f2634);
                box-shadow: 0 0 0 2px color-mix(in srgb, var(--client-color) 28%, transparent);
            }

            .qbd-client-target:disabled {
                opacity: .5;
                cursor: wait;
                transform: none;
            }

            .qbd-client-target-name {
                color: inherit;
            }

            .qbd-client-target-arrow {
                color: var(--client-color);
                font-weight: 900;
                font-size: 1.05em;
                line-height: 1;
            }

            @media (max-width: 760px) {
                .qbd-client-profile-head {
                    grid-template-columns: auto minmax(0, 1fr);
                }
                .qbd-client-profile-head > .qbd-field,
                .qbd-client-profile-head > .qbd-client-default,
                .qbd-client-profile-head > button {
                    grid-column: 1 / -1;
                }
            }
            .qbd-tracker-title {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                color: #f5f5f5;
                text-decoration: none;
                font-weight: 800;
            }
            .qbd-tracker-title:hover {
                text-decoration: underline;
            }
            .qbd-tracker-icon-wrap {
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 20px;
                border-radius: 5px;
                overflow: hidden;
                background: #fff;
                border: 1px solid rgba(255,255,255,.35);
                box-shadow: 0 1px 3px rgba(0,0,0,.28);
            }
            .qbd-tracker-icon {
                width: 16px !important;
                height: 16px !important;
                max-width: 16px !important;
                max-height: 16px !important;
                object-fit: contain;
                display: block;
            }
            .qbd-tracker-icon-fallback {
                width: 20px;
                height: 20px;
                display: none;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 900;
                color: #1f2937;
                background: #fff;
            }
            .qbd-result-actions { display: none; }
            .qbd-result-send { display: none; }
            .qbd-status {
                border-radius: 8px;
                padding: 9px 10px;
                margin-top: 10px;
                font-size: 13px;
                background: var(--qbd-surface);
            }

            /* FINAL OVERRIDE — plain checkboxes.
               Legacy switch CSS exists earlier, so this must stay last. */
            .qbd-overlay .qbd-switch-row {
                display: flex !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 9px !important;
                padding: 6px 0 !important;
                cursor: pointer !important;
            }

            .qbd-overlay .qbd-switch-row > span:first-child {
                order: 2 !important;
                flex: 0 1 auto !important;
                min-width: 0 !important;
            }

            .qbd-overlay .qbd-switch-row > span:last-child {
                order: 1 !important;
                position: static !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: auto !important;
                min-width: 18px !important;
                height: auto !important;
                flex: 0 0 auto !important;
            }

            .qbd-overlay input.qbd-switch-input[type="checkbox"] {
                -webkit-appearance: checkbox !important;
                appearance: auto !important;
                position: static !important;
                opacity: 1 !important;
                pointer-events: auto !important;
                visibility: visible !important;
                display: inline-block !important;
                width: 17px !important;
                min-width: 17px !important;
                max-width: 17px !important;
                height: 17px !important;
                margin: 0 !important;
                padding: 0 !important;
                accent-color: #8b5cf6 !important;
                cursor: pointer !important;
            }

            .qbd-overlay .qbd-switch {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    function notify(text, type = "info", duration = 3600) {
        ensureStyles();

        let toast = document.getElementById("qbd-toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "qbd-toast";

            Object.assign(toast.style, {
                position: "fixed",
                right: "18px",
                bottom: "18px",
                zIndex: "2147483647",
                padding: "9px 13px",
                borderRadius: "9px",
                fontSize: "13px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: "650",
                color: "#fff",
                boxShadow: "0 4px 18px rgba(0,0,0,.28)",
                opacity: "0",
                transform: "translateY(8px)",
                transition: "opacity .18s ease, transform .18s ease",
                pointerEvents: "none",
                maxWidth: "480px"
            });

            document.body.appendChild(toast);
        }

        const backgrounds = {
            info: "rgba(28, 28, 30, .95)",
            success: "rgba(35, 110, 62, .95)",
            warning: "rgba(160, 105, 20, .96)",
            error: "rgba(145, 42, 42, .96)"
        };

        toast.textContent = text;
        toast.style.background = backgrounds[type] || backgrounds.info;
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";

        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(8px)";
        }, duration);
    }

    function createOverlay(innerHtml) {
        ensureStyles();

        const overlay = document.createElement("div");
        overlay.className = "qbd-overlay";
        overlay.innerHTML = `<div class="qbd-modal">${innerHtml}</div>`;
        document.body.appendChild(overlay);
        return overlay;
    }

    // ============================================================
    // POPUP CONFIGURATION
    // ============================================================

    function openConfigModal({ firstRun = false } = {}) {
        return new Promise(resolve => {
            let clientDrafts = (
                Array.isArray(CONFIG.clients) && CONFIG.clients.length
                    ? CONFIG.clients
                    : [createClientProfile("qbittorrent", 0)]
            ).map(normalizeClientProfile);

            function renderClientProfileFields(profile, index) {
                const type = getClientType(profile);

                if (type === "qbittorrent") {
                    return `
                        <div class="qbd-grid">
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("qbitUrl"))}</label>
                                <input type="text" data-client-field="qbitUrl"
                                       placeholder="http://192.168.1.50:8080"
                                       value="${escapeHtml(profile.qbitUrl || "")}">
                            </div>
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("apiKey"))}</label>
                                <input type="password" data-client-field="apiKey"
                                       placeholder="qbt_…"
                                       value="${escapeHtml(profile.apiKey || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("qbitCategory"))}</label>
                                <input type="text" data-client-field="qbitCategory"
                                       value="${escapeHtml(profile.qbitCategory || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("qbitTags"))}</label>
                                <input type="text" data-client-field="qbitTags"
                                       placeholder="PornScout, Adult"
                                       value="${escapeHtml(profile.qbitTags || "")}">
                            </div>
                        </div>
                    `;
                }

                if (type === "rtorrent") {
                    return `
                        <div class="qbd-grid">
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("rtorrentUrl"))}</label>
                                <input type="text" data-client-field="rtorrentUrl"
                                       placeholder="https://seedbox.example/RPC2"
                                       value="${escapeHtml(profile.rtorrentUrl || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("rpcUsername"))}</label>
                                <input type="text" data-client-field="rtorrentUsername"
                                       value="${escapeHtml(profile.rtorrentUsername || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("rpcPassword"))}</label>
                                <input type="password" data-client-field="rtorrentPassword"
                                       value="${escapeHtml(profile.rtorrentPassword || "")}">
                            </div>
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("rtorrentLabel"))}</label>
                                <input type="text" data-client-field="rtorrentLabel"
                                       value="${escapeHtml(profile.rtorrentLabel || "")}">
                            </div>
                        </div>
                    `;
                }

                if (type === "transmission") {
                    return `
                        <div class="qbd-grid">
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("transmissionUrl"))}</label>
                                <input type="text" data-client-field="transmissionUrl"
                                       placeholder="http://192.168.1.50:9091"
                                       value="${escapeHtml(profile.transmissionUrl || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("transmissionUsername"))}</label>
                                <input type="text" data-client-field="transmissionUsername"
                                       value="${escapeHtml(profile.transmissionUsername || "")}">
                            </div>
                            <div class="qbd-field">
                                <label>${escapeHtml(t("transmissionPassword"))}</label>
                                <input type="password" data-client-field="transmissionPassword"
                                       value="${escapeHtml(profile.transmissionPassword || "")}">
                            </div>
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("transmissionLabels"))}</label>
                                <input type="text" data-client-field="transmissionLabels"
                                       placeholder="PornScout, Adult"
                                       value="${escapeHtml(profile.transmissionLabels || "")}">
                            </div>
                        </div>
                    `;
                }

                if (type === "deluge") {
                    return `
                        <div class="qbd-grid">
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("delugeUrl"))}</label>
                                <input type="text" data-client-field="delugeUrl"
                                       placeholder="http://192.168.1.50:8112"
                                       value="${escapeHtml(profile.delugeUrl || "")}">
                            </div>
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("delugePassword"))}</label>
                                <input type="password" data-client-field="delugePassword"
                                       value="${escapeHtml(profile.delugePassword || "")}">
                            </div>
                            <div class="qbd-field qbd-field-full">
                                <label>${escapeHtml(t("delugeLabel"))}</label>
                                <input type="text" data-client-field="delugeLabel"
                                       value="${escapeHtml(profile.delugeLabel || "")}">
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="qbd-grid">
                        <div class="qbd-field qbd-field-full">
                            <label>${escapeHtml(t("floodUrl"))}</label>
                            <input type="text" data-client-field="floodUrl"
                                   placeholder="https://flood.example"
                                   value="${escapeHtml(profile.floodUrl || "")}">
                        </div>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("floodUsername"))}</label>
                            <input type="text" data-client-field="floodUsername"
                                   value="${escapeHtml(profile.floodUsername || "")}">
                        </div>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("floodPassword"))}</label>
                            <input type="password" data-client-field="floodPassword"
                                   value="${escapeHtml(profile.floodPassword || "")}">
                        </div>
                        <div class="qbd-field qbd-field-full">
                            <label>${escapeHtml(t("floodTags"))}</label>
                            <input type="text" data-client-field="floodTags"
                                   placeholder="PornScout, Adult"
                                   value="${escapeHtml(profile.floodTags || "")}">
                        </div>
                    </div>
                `;
            }

            function renderClientProfile(profile, index) {
                return `
                    <div class="qbd-client-profile-card" data-client-index="${index}">
                        <div class="qbd-client-profile-head">
                            <img class="qbd-client-profile-icon"
                                 src="${escapeHtml(clientIconUrl(profile))}"
                                 alt="${escapeHtml(getClientLabel(profile))}">

                            <div class="qbd-field">
                                <label>${escapeHtml(t("clientName"))}</label>
                                <input type="text"
                                       data-client-field="name"
                                       placeholder="${escapeHtml(t("clientNamePlaceholder"))}"
                                       value="${escapeHtml(profile.name || "")}">
                            </div>

                            <div class="qbd-field">
                                <label>${escapeHtml(t("clientTypeLabel"))}</label>
                                <select data-client-field="clientType">
                                    ${[
                                        ["qbittorrent", "qBitTorrent"],
                                        ["rtorrent", "rTorrent / ruTorrent"],
                                        ["transmission", "Transmission"],
                                        ["deluge", "Deluge"],
                                        ["flood", "Flood"]
                                    ].map(([value, label]) =>
                                        `<option value="${value}" ${getClientType(profile) === value ? "selected" : ""}>${label}</option>`
                                    ).join("")}
                                </select>
                            </div>

                            <div class="qbd-field">
                                <label>${escapeHtml(t("clientColor"))}</label>
                                <input class="qbd-client-color"
                                       type="color"
                                       data-client-field="color"
                                       value="${escapeHtml(profile.color)}">
                            </div>

                            <label class="qbd-client-default"
                                   title="${escapeHtml(t("defaultClientHelp"))}">
                                <input type="radio"
                                       name="qbd-default-client"
                                       value="${escapeHtml(profile.id)}"
                                       ${(
                                           CONFIG.defaultClientId === profile.id ||
                                           (!CONFIG.defaultClientId && index === 0)
                                       ) ? "checked" : ""}>
                                ${escapeHtml(t("defaultClient"))}
                            </label>

                            <button type="button"
                                    class="qbd-btn qbd-btn-danger"
                                    data-remove-client="${index}">
                                ${escapeHtml(t("removeClient"))}
                            </button>
                        </div>

                        <div class="qbd-client-profile-fields">
                            ${renderClientProfileFields(profile, index)}
                        </div>
                    </div>
                `;
            }

            function syncClientDraftsFromDom(overlay) {
                if (!overlay) return;

                const cards = [...overlay.querySelectorAll("[data-client-index]")];

                clientDrafts = cards.map((card, index) => {
                    const previous = clientDrafts[index] || createClientProfile("qbittorrent", index);
                    const next = { ...previous };

                    card.querySelectorAll("[data-client-field]").forEach(input => {
                        next[input.dataset.clientField] = input.value;
                    });

                    return normalizeClientProfile(next, index);
                });
            }

            function render() {
                const existing = document.querySelector(".qbd-overlay[data-pornscout-config='1']");
                if (existing) existing.remove();

                const overlay = createOverlay(`
                    <div class="qbd-brand">
                        <div class="qbd-header-left">
                            <a class="qbd-header-icon-btn"
                               href="https://github.com/Aerya/PornScout"
                               target="_blank"
                               rel="noopener noreferrer"
                               title="PornScout — GitHub"
                               aria-label="PornScout — GitHub">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.11.79-.25.79-.56v-2.03c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.16 1.19a10.9 10.9 0 0 1 5.76 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"/>
                                </svg>
                                <span class="qbd-github-badge">PS</span>
                            </a>

                            <a class="qbd-header-icon-btn"
                               href="https://github.com/Aerya/MiniVid"
                               target="_blank"
                               rel="noopener noreferrer"
                               title="MiniVid — GitHub"
                               aria-label="MiniVid — GitHub">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.11.79-.25.79-.56v-2.03c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.16 1.19a10.9 10.9 0 0 1 5.76 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"/>
                                </svg>
                                <span class="qbd-github-badge">MV</span>
                            </a>
                        </div>

                        <div class="qbd-brand-logo-panel">
                            <img class="qbd-brand-logo" src="${svgToDataUri(PORNSCOUT_LOGO_SVG)}" alt="PornScout">
                        </div>

                        <div class="qbd-header-right">
                            <div class="qbd-lang-switch" aria-label="${escapeHtml(t("language"))}">
                                <button class="qbd-lang-btn ${UI_LANG === "fr" ? "qbd-active" : ""}" data-lang="fr" title="Français">🇫🇷</button>
                                <button class="qbd-lang-btn ${UI_LANG === "en" ? "qbd-active" : ""}" data-lang="en" title="English">🇬🇧</button>
                            </div>

                            <button class="qbd-header-icon-btn ${CONFIG_VIEW === "ultrawide" ? "qbd-active" : ""}"
                                    type="button"
                                    id="qbd-cfg-layout-toggle"
                                    title="${escapeHtml(CONFIG_VIEW === "ultrawide" ? t("standardMode") : t("ultrawideMode"))}"
                                    aria-label="${escapeHtml(CONFIG_VIEW === "ultrawide" ? t("standardMode") : t("ultrawideMode"))}">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <rect x="2.5" y="5" width="19" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
                                    <path d="M7 11h10M7 11l2.2-2.2M7 11l2.2 2.2M17 11l-2.2-2.2M17 11l-2.2 2.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M9 20h6M12 17v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <h2>${escapeHtml(t("configTitle"))}</h2>
                    <div class="qbd-muted">${escapeHtml(t("configIntro"))}</div>

                    <div class="qbd-config-columns">
                        <div class="qbd-config-column">

                    <h3>${escapeHtml(t("clientChoice"))}</h3>
                    <div class="qbd-muted">${escapeHtml(t("clientsHelp"))}</div>

                    <div class="qbd-client-profiles" id="qbd-client-profiles">
                        ${clientDrafts.map((profile, index) =>
                            renderClientProfile(profile, index)
                        ).join("")}
                    </div>

                    <button type="button"
                            class="qbd-btn qbd-add-client"
                            id="qbd-add-client">
                        + ${escapeHtml(t("addClient"))}
                    </button>

                    <div class="qbd-grid" style="margin-top:16px">
                        <div class="qbd-field">
                            <label>${escapeHtml(t("minimumResolution"))}</label>
                            <select id="qbd-cfg-minres">
                                ${[720,1080,1440,2160].map(v =>
                                    `<option value="${v}" ${Number(CONFIG.minimumResolution) === v ? "selected" : ""}>${v === 2160 ? "2160p / 4K" : v + "p"}</option>`
                                ).join("")}
                            </select>
                        </div>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("scriptVersion"))}</label>
                            <input type="text" value="${SCRIPT_VERSION}" disabled>
                        </div>
                    </div>

                    <h3>${escapeHtml(t("trackersSection"))}</h3>
                    <div class="qbd-muted">${escapeHtml(t("trackersHelp"))}</div>
                    <div class="qbd-tracker-toggle-grid">
                        ${PROVIDERS.map(provider => `
                            <label class="qbd-switch-row">
                                <span>${escapeHtml(provider.label)}</span>
                                <span>
                                    <input class="qbd-switch-input"
                                           id="qbd-cfg-tracker-${escapeHtml(provider.id)}"
                                           type="checkbox"
                                           ${CONFIG.enabledTrackers?.[provider.id] !== false ? "checked" : ""}>
                                    <span class="qbd-switch" aria-hidden="true"></span>
                                </span>
                            </label>
                        `).join("")}
                    </div>

                        </div>
                        <div class="qbd-config-column">

                    <h3>${escapeHtml(t("upgradePrefs"))}</h3>
                    <div class="qbd-muted">${escapeHtml(t("upgradeHelp"))}</div>

                    <div class="qbd-inline-pref" style="margin-top:8px">
                        <label class="qbd-switch-row" style="padding:0">
                            <span>${escapeHtml(t("maxSizeToggle"))}</span>
                            <span>
                                <input class="qbd-switch-input"
                                       id="qbd-cfg-upgrade-maxsize-enabled"
                                       type="checkbox"
                                       ${CONFIG.upgradeUseMaxSize ? "checked" : ""}>
                                <span class="qbd-switch" aria-hidden="true"></span>
                            </span>
                        </label>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("maxSizeGiB"))}</label>
                            <input id="qbd-cfg-upgrade-maxsize"
                                   type="number"
                                   min="0.1"
                                   step="0.1"
                                   value="${escapeHtml(String(CONFIG.upgradeMaxSizeGiB || 20))}">
                        </div>
                    </div>

                    <div class="qbd-pref-grid" style="margin-top:10px">
                        <div class="qbd-field">
                            <label>${escapeHtml(t("codecPrefs"))}</label>
                            <input id="qbd-cfg-upgrade-codecs"
                                   type="text"
                                   placeholder="AV1, HEVC, AVC"
                                   value="${escapeHtml(CONFIG.upgradePreferredCodecs || "")}">
                            <div class="qbd-pref-hint">${escapeHtml(t("codecPrefsHelp"))}</div>
                        </div>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("sourcePrefs"))}</label>
                            <input id="qbd-cfg-upgrade-sources"
                                   type="text"
                                   placeholder="REMUX, WEB-DL, BluRay"
                                   value="${escapeHtml(CONFIG.upgradePreferredSources || "")}">
                            <div class="qbd-pref-hint">${escapeHtml(t("sourcePrefsHelp"))}</div>
                        </div>
                    </div>

                    <div class="qbd-inline-pref" style="margin-top:10px">
                        <label class="qbd-switch-row" style="padding:0">
                            <span>${escapeHtml(t("minSeedersToggle"))}</span>
                            <span>
                                <input class="qbd-switch-input"
                                       id="qbd-cfg-upgrade-seeders-enabled"
                                       type="checkbox"
                                       ${CONFIG.upgradeUseMinSeeders ? "checked" : ""}>
                                <span class="qbd-switch" aria-hidden="true"></span>
                            </span>
                        </label>
                        <div class="qbd-field">
                            <label>${escapeHtml(t("minSeeders"))}</label>
                            <input id="qbd-cfg-upgrade-seeders"
                                   type="number"
                                   min="0"
                                   step="1"
                                   value="${escapeHtml(String(CONFIG.upgradeMinSeeders ?? 1))}">
                        </div>
                    </div>

                    <h3>${escapeHtml(t("dynamicTags"))}</h3>
                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("dynamicTagsEnable"))}</span>
                        <span>
                            <input class="qbd-switch-input"
                                   id="qbd-cfg-dynamic-tags"
                                   type="checkbox"
                                   ${CONFIG.dynamicTagsEnabled ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>
                    <div class="qbd-dynamic-tag-grid" id="qbd-dynamic-tag-options">
                        ${[
                            ["qbd-cfg-dynamic-pornscout", "dynamicPornScout", CONFIG.dynamicTagPornScout],
                            ["qbd-cfg-dynamic-tracker", "dynamicTracker", CONFIG.dynamicTagTracker],
                            ["qbd-cfg-dynamic-resolution", "dynamicResolution", CONFIG.dynamicTagResolution],
                            ["qbd-cfg-dynamic-codec", "dynamicCodec", CONFIG.dynamicTagCodec],
                            ["qbd-cfg-dynamic-source", "dynamicSource", CONFIG.dynamicTagSource]
                        ].map(([id, labelKey, checked]) => `
                            <label class="qbd-switch-row">
                                <span>${escapeHtml(t(labelKey))}</span>
                                <span>
                                    <input class="qbd-switch-input"
                                           id="${id}"
                                           type="checkbox"
                                           ${checked ? "checked" : ""}>
                                    <span class="qbd-switch" aria-hidden="true"></span>
                                </span>
                            </label>
                        `).join("")}
                    </div>

                    <h3>${escapeHtml(t("behavior"))}</h3>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("forceStart"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-force" type="checkbox" ${CONFIG.forceStart ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("warnLow"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-low" type="checkbox" ${CONFIG.warnBelowMinimum ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("checkSimilar"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-similar" type="checkbox" ${CONFIG.checkSimilarInQbit ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("searchTrackers"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-search" type="checkbox" ${CONFIG.searchBetterOnTrackers ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("showPanel"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-panel" type="checkbox" ${CONFIG.showQualitySearchPanel ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                    <label class="qbd-switch-row">
                        <span>${escapeHtml(t("debug"))}</span>
                        <span>
                            <input class="qbd-switch-input" id="qbd-cfg-debug" type="checkbox" ${CONFIG.debug ? "checked" : ""}>
                            <span class="qbd-switch" aria-hidden="true"></span>
                        </span>
                    </label>

                        </div>
                    </div>

                    <div id="qbd-cfg-status" class="qbd-status" style="display:none"></div>

                    <div class="qbd-actions">
                        ${firstRun ? "" : `<button class="qbd-btn" id="qbd-cfg-cancel">${escapeHtml(t("cancel"))}</button>`}
                        <button class="qbd-btn qbd-btn-danger" id="qbd-cfg-reset">${escapeHtml(t("reset"))}</button>
                        <button class="qbd-btn qbd-btn-warn" id="qbd-cfg-test">${escapeHtml(t("testAllClients"))}</button>
                        <button class="qbd-btn qbd-btn-primary" id="qbd-cfg-save">${escapeHtml(t("save"))}</button>
                    </div>
                `);

                overlay.dataset.pornscoutConfig = "1";
                const modal = overlay.querySelector(".qbd-modal");
                modal?.classList.toggle("qbd-ultrawide", CONFIG_VIEW === "ultrawide");

                const $ = selector => overlay.querySelector(selector);

                function refreshUpgradeFields() {
                    const maxEnabled = $("#qbd-cfg-upgrade-maxsize-enabled").checked;
                    $("#qbd-cfg-upgrade-maxsize").disabled = !maxEnabled;

                    const seedEnabled = $("#qbd-cfg-upgrade-seeders-enabled").checked;
                    $("#qbd-cfg-upgrade-seeders").disabled = !seedEnabled;

                    const dynamicEnabled = $("#qbd-cfg-dynamic-tags").checked;
                    overlay.querySelectorAll("#qbd-dynamic-tag-options input").forEach(input => {
                        input.disabled = !dynamicEnabled;
                    });
                    $("#qbd-dynamic-tag-options").style.opacity = dynamicEnabled ? "1" : ".55";
                }

                function readForm() {
                    syncClientDraftsFromDom(overlay);

                    const defaultClientId =
                        overlay.querySelector('input[name="qbd-default-client"]:checked')?.value ||
                        clientDrafts[0]?.id ||
                        "";

                    return {
                        clients: clientDrafts.map(normalizeClientProfile),
                        defaultClientId,

                        enabledTrackers: Object.fromEntries(
                            PROVIDERS.map(provider => [
                                provider.id,
                                $(`#qbd-cfg-tracker-${provider.id}`)?.checked !== false
                            ])
                        ),

                        upgradeUseMaxSize: $("#qbd-cfg-upgrade-maxsize-enabled").checked,
                        upgradeMaxSizeGiB: Math.max(0.1, Number($("#qbd-cfg-upgrade-maxsize").value) || 20),
                        upgradePreferredCodecs: $("#qbd-cfg-upgrade-codecs").value.trim(),
                        upgradePreferredSources: $("#qbd-cfg-upgrade-sources").value.trim(),
                        upgradeUseMinSeeders: $("#qbd-cfg-upgrade-seeders-enabled").checked,
                        upgradeMinSeeders: Math.max(0, Math.floor(Number($("#qbd-cfg-upgrade-seeders").value) || 0)),

                        dynamicTagsEnabled: $("#qbd-cfg-dynamic-tags").checked,
                        dynamicTagPornScout: $("#qbd-cfg-dynamic-pornscout").checked,
                        dynamicTagTracker: $("#qbd-cfg-dynamic-tracker").checked,
                        dynamicTagResolution: $("#qbd-cfg-dynamic-resolution").checked,
                        dynamicTagCodec: $("#qbd-cfg-dynamic-codec").checked,
                        dynamicTagSource: $("#qbd-cfg-dynamic-source").checked,

                        minimumResolution: Number($("#qbd-cfg-minres").value) || 1080,
                        forceStart: $("#qbd-cfg-force").checked,
                        warnBelowMinimum: $("#qbd-cfg-low").checked,
                        checkSimilarInQbit: $("#qbd-cfg-similar").checked,
                        searchBetterOnTrackers: $("#qbd-cfg-search").checked,
                        showQualitySearchPanel: $("#qbd-cfg-panel").checked,
                        debug: $("#qbd-cfg-debug").checked
                    };
                }

                refreshUpgradeFields();

                [
                    "#qbd-cfg-upgrade-maxsize-enabled",
                    "#qbd-cfg-upgrade-seeders-enabled",
                    "#qbd-cfg-dynamic-tags"
                ].forEach(selector => {
                    $(selector)?.addEventListener("change", refreshUpgradeFields);
                });

                $("#qbd-add-client")?.addEventListener("click", () => {
                    syncClientDraftsFromDom(overlay);
                    clientDrafts.push(
                        createClientProfile(
                            "qbittorrent",
                            clientDrafts.length
                        )
                    );
                    overlay.remove();
                    render();
                });

                overlay.querySelectorAll("[data-remove-client]").forEach(button => {
                    button.addEventListener("click", () => {
                        syncClientDraftsFromDom(overlay);
                        const index = Number(button.dataset.removeClient);
                        clientDrafts.splice(index, 1);

                        if (!clientDrafts.length) {
                            clientDrafts.push(createClientProfile("qbittorrent", 0));
                        }

                        overlay.remove();
                        render();
                    });
                });

                overlay.querySelectorAll('[data-client-field="clientType"]').forEach(select => {
                    select.addEventListener("change", () => {
                        syncClientDraftsFromDom(overlay);
                        overlay.remove();
                        render();
                    });
                });

                const status = $("#qbd-cfg-status");

                $("#qbd-cfg-layout-toggle")?.addEventListener("click", () => {
                    CONFIG_VIEW = CONFIG_VIEW === "ultrawide"
                        ? "standard"
                        : "ultrawide";

                    GM_setValue(CONFIG_VIEW_KEY, CONFIG_VIEW);

                    modal?.classList.toggle(
                        "qbd-ultrawide",
                        CONFIG_VIEW === "ultrawide"
                    );

                    const button = $("#qbd-cfg-layout-toggle");
                    button?.classList.toggle(
                        "qbd-active",
                        CONFIG_VIEW === "ultrawide"
                    );

                    const title = CONFIG_VIEW === "ultrawide"
                        ? t("standardMode")
                        : t("ultrawideMode");

                    if (button) {
                        button.title = title;
                        button.setAttribute("aria-label", title);
                    }
                });

                overlay.querySelectorAll("[data-lang]").forEach(button => {
                    button.addEventListener("click", () => {
                        const pending = readForm();
                        CONFIG = normalizeStoredConfig({ ...CONFIG, ...pending });
                        clientDrafts = pending.clients.map(normalizeClientProfile);
                        UI_LANG = button.dataset.lang === "en" ? "en" : "fr";
                        GM_setValue(UI_LANG_KEY, UI_LANG);
                        overlay.remove();
                        render();
                        updateFloatingButtonTooltip();
                    });
                });

                $("#qbd-cfg-test").addEventListener("click", async () => {
                    const temp = readForm();
                    status.style.display = "block";
                    status.textContent = t("testing");

                    const profiles = getClientProfiles(temp);

                    if (!profiles.length) {
                        status.textContent = t("clientRequired");
                        return;
                    }

                    const lines = [];

                    for (const profile of profiles) {
                        try {
                            const runtime = clientRuntimeConfig(profile, temp);
                            const version = await testClient(runtime);
                            lines.push(`✓ ${getClientDisplayName(profile)} — ${version}`);
                        } catch (error) {
                            lines.push(`✕ ${getClientDisplayName(profile)} — ${error.message}`);
                        }
                    }

                    status.innerHTML = lines
                        .map(line => escapeHtml(line))
                        .join("<br>");
                });

                $("#qbd-cfg-reset").addEventListener("click", () => {
                    if (!confirm(t("resetConfirm"))) return;

                    GM_deleteValue(STORAGE_KEY);
                    CONFIG = { ...DEFAULT_CONFIG };
                    overlay.remove();
                    notify(t("configReset"), "warning");
                    resolve(false);
                    setTimeout(() => openConfigModal({ firstRun: true }), 0);
                });

                $("#qbd-cfg-save").addEventListener("click", () => {
                    const next = readForm();

                    if (!hasAnyClientConfig(next)) {
                        status.style.display = "block";
                        status.textContent = t("clientRequired");
                        return;
                    }

                    saveConfig(next);
                    overlay.remove();
                    notify(t("configSaved"), "success");
                    resolve(true);
                });

                if (!firstRun) {
                    $("#qbd-cfg-cancel").addEventListener("click", () => {
                        overlay.remove();
                        resolve(false);
                    });
                }
            }

            render();
        });
    }

    // ============================================================
    // RÉSEAU
    // ============================================================

    function gmRequest(options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                anonymous: false,
                ...options,
                onload: response => resolve(response),
                onerror: error => reject(new Error("Erreur réseau : " + JSON.stringify(error))),
                ontimeout: () => reject(new Error("Timeout réseau"))
            });
        });
    }

    function qbitHeaders(config = CONFIG, extra = {}) {
        return {
            Authorization: "Bearer " + String(config.apiKey || "").trim(),
            ...extra
        };
    }

    async function qbitGet(path, config = CONFIG, timeout = 12000) {
        const response = await gmRequest({
            method: "GET",
            url: normalizeBaseUrl(config.qbitUrl) + path,
            headers: qbitHeaders(config),
            timeout
        });

        if (response.status !== 200) {
            throw new Error(`qBitTorrent HTTP ${response.status}${response.responseText ? " — " + response.responseText.trim().slice(0, 220) : ""}`);
        }

        return response;
    }

    async function qbitPost(path, data, config = CONFIG, timeout = 15000, extraHeaders = {}) {
        const response = await gmRequest({
            method: "POST",
            url: normalizeBaseUrl(config.qbitUrl) + path,
            headers: qbitHeaders(config, extraHeaders),
            data,
            timeout
        });

        return response;
    }

    async function testQbit(config = CONFIG) {
        if (!hasQbitConfig(config)) {
            throw new Error("Configuration qBitTorrent incomplète");
        }

        const response = await qbitGet("/api/v2/app/version", config, 10000);
        return response.responseText.trim();
    }

    // ============================================================
    // CLIENTS BITTORRENT — ADAPTATEURS
    // ============================================================

    function responseHeader(response, name) {
        const headers = String(response.responseHeaders || "");
        const match = headers.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, "im"));
        return match ? match[1].trim() : "";
    }

    function parseCommaList(value) {
        return String(value || "")
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    function sanitizeClientLabel(value) {
        return String(value || "")
            .replace(/[,\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function buildDynamicTags(context = {}, config = CONFIG) {
        if (!config.dynamicTagsEnabled) {
            return [];
        }

        const tags = [];

        if (config.dynamicTagPornScout) {
            tags.push("PornScout");
        }

        if (config.dynamicTagTracker && context.tracker) {
            tags.push(sanitizeClientLabel(context.tracker));
        }

        if (config.dynamicTagResolution && context.resolution?.value) {
            tags.push(`${Number(context.resolution.value)}p`);
        }

        if (config.dynamicTagCodec && context.codec) {
            tags.push(sanitizeClientLabel(context.codec));
        }

        if (config.dynamicTagSource && context.source) {
            tags.push(sanitizeClientLabel(context.source));
        }

        return [...new Set(tags.filter(Boolean))];
    }

    function combinedOrganizationLabels(staticValues, context, config = CONFIG) {
        return [
            ...staticValues,
            ...buildDynamicTags(context, config)
        ].filter(Boolean)
         .filter((value, index, array) => array.indexOf(value) === index);
    }

    async function ensureQbitOrganization(config = CONFIG, context = {}) {
        const category = String(config.qbitCategory || "").trim();
        const tags = combinedOrganizationLabels(
            parseCommaList(config.qbitTags),
            context,
            config
        );

        if (category) {
            try {
                const response = await qbitGet(
                    "/api/v2/torrents/categories",
                    config
                );

                const categories = JSON.parse(response.responseText || "{}");

                if (!Object.prototype.hasOwnProperty.call(categories, category)) {
                    await qbitPost(
                        "/api/v2/torrents/createCategory",
                        "category=" + encodeURIComponent(category),
                        config,
                        10000,
                        { "Content-Type": "application/x-www-form-urlencoded" }
                    );
                }
            } catch (error) {
                log("Création catégorie qBitTorrent impossible", error);
            }
        }

        if (tags.length) {
            try {
                const response = await qbitGet(
                    "/api/v2/torrents/tags",
                    config
                );

                const existing = new Set(
                    JSON.parse(response.responseText || "[]")
                );

                const missing = tags.filter(tag => !existing.has(tag));

                if (missing.length) {
                    await qbitPost(
                        "/api/v2/torrents/createTags",
                        "tags=" + encodeURIComponent(missing.join(",")),
                        config,
                        10000,
                        { "Content-Type": "application/x-www-form-urlencoded" }
                    );
                }
            } catch (error) {
                log("Création tags qBitTorrent impossible", error);
            }
        }
    }

    // ---------- Transmission ----------

    async function transmissionHttp(config, payload, sessionId = "") {
        const headers = {
            "Content-Type": "application/json",
            ...basicAuthHeaders(config.transmissionUsername, config.transmissionPassword)
        };

        if (sessionId) {
            headers["X-Transmission-Session-Id"] = sessionId;
        }

        let response = await gmRequest({
            method: "POST",
            url: normalizeTransmissionUrl(config.transmissionUrl),
            headers,
            data: JSON.stringify(payload),
            timeout: 15000
        });

        if (response.status === 409) {
            const freshId = responseHeader(response, "X-Transmission-Session-Id");
            if (!freshId) {
                throw new Error("Transmission HTTP 409 sans X-Transmission-Session-Id");
            }

            headers["X-Transmission-Session-Id"] = freshId;

            response = await gmRequest({
                method: "POST",
                url: normalizeTransmissionUrl(config.transmissionUrl),
                headers,
                data: JSON.stringify(payload),
                timeout: 15000
            });
        }

        if (response.status !== 200 && response.status !== 204) {
            throw new Error(`Transmission HTTP ${response.status}`);
        }

        if (response.status === 204 || !String(response.responseText || "").trim()) {
            return {};
        }

        try {
            return JSON.parse(response.responseText);
        } catch (_) {
            throw new Error("Réponse Transmission JSON invalide");
        }
    }

    async function transmissionRpc(config, legacyMethod, modernMethod, legacyArgs = {}, modernParams = null) {
        // Try the pre-4.1 protocol first for broad compatibility.
        const legacyPayload = {
            method: legacyMethod,
            arguments: legacyArgs,
            tag: 1
        };

        const legacy = await transmissionHttp(config, legacyPayload);

        if (
            legacy &&
            typeof legacy === "object" &&
            legacy.result === "success"
        ) {
            return {
                style: "legacy",
                result: legacy.arguments || {}
            };
        }

        // Transmission 4.1+ uses JSON-RPC 2.0 + snake_case.
        const modernPayload = {
            jsonrpc: "2.0",
            method: modernMethod,
            params: modernParams ?? legacyArgs,
            id: 1
        };

        const modern = await transmissionHttp(config, modernPayload);

        if (modern.error) {
            throw new Error(
                "Transmission RPC : " +
                (modern.error.message || JSON.stringify(modern.error))
            );
        }

        return {
            style: "modern",
            result: modern.result || {}
        };
    }

    async function testTransmission(config = CONFIG) {
        try {
            const call = await transmissionRpc(
                config,
                "session-get",
                "session_get",
                {},
                {}
            );

            return (
                call.result.version ||
                call.result.rpc_version_semver ||
                call.result["rpc-version-semver"] ||
                "RPC OK"
            );
        } catch (error) {
            throw new Error("Transmission : " + error.message);
        }
    }

    async function listTransmissionTorrents(config = CONFIG) {
        // Legacy field names differ from current snake_case field names.
        let call;

        try {
            call = await transmissionRpc(
                config,
                "torrent-get",
                "torrent_get",
                { fields: ["id", "name", "hashString", "files", "downloadDir"] },
                { fields: ["id", "name", "hash_string", "files", "download_dir"] }
            );
        } catch (error) {
            throw new Error("Transmission liste torrents : " + error.message);
        }

        const torrents = call.result.torrents || [];

        return torrents.map(item => ({
            hash: String(item.hash_string || item.hashString || "").toLowerCase(),
            name: item.name || "",
            content_path: item.download_dir || item.downloadDir || "",
            files: Array.isArray(item.files)
                ? item.files.map(file => ({
                    name: file.name || "",
                    size: file.length || 0
                }))
                : []
        }));
    }

    async function addTransmissionTorrent(buffer, filename, config = CONFIG, context = {}) {
        const b64 = arrayBufferToBase64(buffer);

        const labels = combinedOrganizationLabels(
            parseCommaList(config.transmissionLabels),
            context,
            config
        );

        let call;

        try {
            call = await transmissionRpc(
                config,
                "torrent-add",
                "torrent_add",
                {
                    metainfo: b64,
                    paused: !config.forceStart,
                    ...(labels.length ? { labels } : {})
                },
                {
                    metainfo: b64,
                    paused: !config.forceStart,
                    ...(labels.length ? { labels } : {})
                }
            );
        } catch (error) {
            // Older Transmission versions may not support labels.
            if (!labels.length) throw error;

            log("Labels Transmission non supportés, nouvel essai sans labels", error);

            call = await transmissionRpc(
                config,
                "torrent-add",
                "torrent_add",
                {
                    metainfo: b64,
                    paused: !config.forceStart
                },
                {
                    metainfo: b64,
                    paused: !config.forceStart
                }
            );
        }

        const result = call.result || {};
        const duplicate =
            result.torrent_duplicate ||
            result["torrent-duplicate"];

        const added =
            result.torrent_added ||
            result["torrent-added"];

        return {
            duplicate: Boolean(duplicate),
            hash: String(
                duplicate?.hash_string ||
                duplicate?.hashString ||
                added?.hash_string ||
                added?.hashString ||
                ""
            ).toLowerCase()
        };
    }

    // ---------- Deluge ----------

    let delugeRpcId = 1;

    function delugeJsonUrl(config = CONFIG) {
        const base = normalizeBaseUrl(config.delugeUrl);
        return /\/json$/i.test(base) ? base : base + "/json";
    }

    async function delugeRpc(config, method, params = []) {
        const response = await gmRequest({
            method: "POST",
            url: delugeJsonUrl(config),
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: JSON.stringify({
                method,
                params,
                id: delugeRpcId++
            }),
            anonymous: false,
            withCredentials: true,
            timeout: 15000
        });

        if (response.status !== 200) {
            throw new Error(`Deluge HTTP ${response.status}`);
        }

        let data;
        try {
            data = JSON.parse(response.responseText);
        } catch (_) {
            throw new Error("Réponse Deluge JSON invalide");
        }

        if (data.error) {
            throw new Error(
                data.error.message ||
                data.error.exception_msg ||
                JSON.stringify(data.error)
            );
        }

        return data.result;
    }

    async function delugeEnsureSession(config = CONFIG) {
        const logged = await delugeRpc(
            config,
            "auth.login",
            [String(config.delugePassword || "")]
        );

        if (!logged) {
            throw new Error("Deluge : mot de passe WebUI refusé");
        }

        let connected = await delugeRpc(config, "web.connected", []);

        if (!connected) {
            const hosts = await delugeRpc(config, "web.get_hosts", []);
            if (!Array.isArray(hosts) || !hosts.length) {
                throw new Error("Deluge : aucun daemon configuré dans la WebUI");
            }

            await delugeRpc(config, "web.connect", [hosts[0][0]]);
            connected = await delugeRpc(config, "web.connected", []);
        }

        if (!connected) {
            throw new Error("Deluge : WebUI non connectée au daemon");
        }

        return true;
    }

    async function testDeluge(config = CONFIG) {
        await delugeEnsureSession(config);
        const hosts = await delugeRpc(config, "web.get_hosts", []);
        return `WebUI OK${Array.isArray(hosts) && hosts.length ? " / daemon configuré" : ""}`;
    }

    async function listDelugeTorrents(config = CONFIG) {
        await delugeEnsureSession(config);

        const result = await delugeRpc(
            config,
            "core.get_torrents_status",
            [{}, ["name", "files", "save_path"]]
        );

        return Object.entries(result || {}).map(([hash, item]) => ({
            hash: String(hash).toLowerCase(),
            name: item?.name || "",
            content_path: item?.save_path || "",
            files: Array.isArray(item?.files)
                ? item.files.map(file => ({
                    name: file.path || file.name || "",
                    size: file.size || 0
                }))
                : []
        }));
    }

    async function addDelugeTorrent(buffer, filename, config = CONFIG, context = {}) {
        await delugeEnsureSession(config);

        const torrentId = await delugeRpc(
            config,
            "core.add_torrent_file",
            [
                filename || "download.torrent",
                arrayBufferToBase64(buffer),
                {
                    add_paused: !config.forceStart
                }
            ]
        );

        const delugeLabels = combinedOrganizationLabels(
            String(config.delugeLabel || "").trim()
                ? [String(config.delugeLabel).trim()]
                : [],
            context,
            config
        );

        // Deluge's Label plugin supports one label per torrent.
        const label = delugeLabels
            .map(value => sanitizeClientLabel(value).replace(/\s+/g, "_"))
            .join("_")
            .slice(0, 96);

        if (torrentId && label) {
            try {
                let labels = await delugeRpc(config, "label.get_labels", []);

                if (!Array.isArray(labels)) labels = [];

                if (!labels.includes(label)) {
                    await delugeRpc(config, "label.add", [label]);
                }

                await delugeRpc(
                    config,
                    "label.set_torrent",
                    [torrentId, label]
                );
            } catch (error) {
                log("Label Deluge non appliqué (plugin Label requis)", error);
            }
        }

        return {
            duplicate: !torrentId,
            hash: String(torrentId || "").toLowerCase()
        };
    }

    // ---------- rTorrent / ruTorrent ----------

    function xmlEscape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    function xmlRpcEncodeValue(value) {
        if (value && value.__base64) {
            return `<value><base64>${value.__base64}</base64></value>`;
        }

        if (Array.isArray(value)) {
            return `<value><array><data>${value.map(xmlRpcEncodeValue).join("")}</data></array></value>`;
        }

        if (typeof value === "number") {
            return `<value><int>${Math.trunc(value)}</int></value>`;
        }

        if (typeof value === "boolean") {
            return `<value><boolean>${value ? 1 : 0}</boolean></value>`;
        }

        return `<value><string>${xmlEscape(value)}</string></value>`;
    }

    function parseXmlRpcValue(valueNode) {
        if (!valueNode) return null;

        const child = [...valueNode.children][0];
        if (!child) return valueNode.textContent || "";

        switch (child.tagName) {
            case "string":
            case "base64":
            case "dateTime.iso8601":
                return child.textContent || "";
            case "int":
            case "i4":
            case "i8":
                return Number(child.textContent || 0);
            case "boolean":
                return child.textContent === "1";
            case "double":
                return Number(child.textContent || 0);
            case "array":
                return [...child.querySelectorAll(":scope > data > value")]
                    .map(parseXmlRpcValue);
            case "struct": {
                const obj = {};
                child.querySelectorAll(":scope > member").forEach(member => {
                    const name = member.querySelector(":scope > name")?.textContent || "";
                    const value = member.querySelector(":scope > value");
                    obj[name] = parseXmlRpcValue(value);
                });
                return obj;
            }
            default:
                return child.textContent || "";
        }
    }

    async function rtorrentCall(config, method, params = []) {
        const body =
            `<?xml version="1.0"?>` +
            `<methodCall>` +
            `<methodName>${xmlEscape(method)}</methodName>` +
            `<params>${params.map(value => `<param>${xmlRpcEncodeValue(value)}</param>`).join("")}</params>` +
            `</methodCall>`;

        const response = await gmRequest({
            method: "POST",
            url: normalizeRpcUrl(config.rtorrentUrl),
            headers: {
                "Content-Type": "text/xml",
                ...basicAuthHeaders(config.rtorrentUsername, config.rtorrentPassword)
            },
            data: body,
            timeout: 15000
        });

        if (response.status !== 200) {
            throw new Error(`rTorrent XML-RPC HTTP ${response.status}`);
        }

        const doc = new DOMParser().parseFromString(response.responseText, "text/xml");

        const fault = doc.querySelector("methodResponse > fault > value");
        if (fault) {
            const parsed = parseXmlRpcValue(fault);
            throw new Error(
                "rTorrent XML-RPC : " +
                (parsed?.faultString || JSON.stringify(parsed))
            );
        }

        return parseXmlRpcValue(
            doc.querySelector("methodResponse > params > param > value")
        );
    }

    async function testRtorrent(config = CONFIG) {
        const methods = await rtorrentCall(config, "system.listMethods", []);
        return Array.isArray(methods)
            ? `XML-RPC OK (${methods.length} méthodes)`
            : "XML-RPC OK";
    }

    async function listRtorrentTorrents(config = CONFIG) {
        const rows = await rtorrentCall(
            config,
            "d.multicall2",
            ["", "main", "d.hash=", "d.name=", "d.directory="]
        );

        if (!Array.isArray(rows)) return [];

        return rows.map(row => ({
            hash: String(row?.[0] || "").toLowerCase(),
            name: row?.[1] || "",
            content_path: row?.[2] || "",
            files: []
        }));
    }

    async function addRtorrentTorrent(buffer, filename, config = CONFIG, context = {}) {
        const method = config.forceStart ? "load.raw_start" : "load.raw";

        const params = [
            "",
            { __base64: arrayBufferToBase64(buffer) }
        ];

        const rtorrentLabels = combinedOrganizationLabels(
            String(config.rtorrentLabel || "").trim()
                ? [String(config.rtorrentLabel).trim()]
                : [],
            context,
            config
        );

        const label = rtorrentLabels
            .map(sanitizeClientLabel)
            .join(" / ")
            .slice(0, 160);

        if (label) {
            // ruTorrent labels are conventionally stored in rTorrent custom1.
            params.push(`d.custom1.set=${label}`);
        }

        await rtorrentCall(
            config,
            method,
            params
        );

        return {
            duplicate: false,
            hash: ""
        };
    }

    // ---------- Flood ----------

    function floodApiUrl(config = {}) {
        return normalizeBaseUrl(config.floodUrl);
    }

    async function floodRequest(config, method, path, body = undefined) {
        const options = {
            method,
            url: floodApiUrl(config) + path,
            headers: {
                "Accept": "application/json"
            },
            anonymous: false,
            withCredentials: true,
            timeout: 15000
        };

        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.data = JSON.stringify(body);
        }

        const response = await gmRequest(options);

        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                `Flood HTTP ${response.status}` +
                (response.responseText
                    ? " — " + response.responseText.trim().slice(0, 220)
                    : "")
            );
        }

        if (!String(response.responseText || "").trim()) {
            return null;
        }

        try {
            return JSON.parse(response.responseText);
        } catch (_) {
            return response.responseText;
        }
    }

    async function floodEnsureSession(config = CONFIG) {
        const body = {};

        if (String(config.floodUsername || "").trim()) {
            body.username = String(config.floodUsername).trim();
        }

        if (String(config.floodPassword || "")) {
            body.password = String(config.floodPassword);
        }

        await floodRequest(
            config,
            "POST",
            "/api/auth/authenticate",
            body
        );

        return true;
    }

    async function testFlood(config = CONFIG) {
        await floodEnsureSession(config);
        await floodRequest(config, "GET", "/api/auth/verify");
        return "API OK";
    }

    function normalizeFloodTorrentList(payload) {
        const candidates = [];

        if (Array.isArray(payload)) {
            candidates.push(...payload);
        } else if (Array.isArray(payload?.torrents)) {
            candidates.push(...payload.torrents);
        } else if (payload?.torrents && typeof payload.torrents === "object") {
            for (const [hash, item] of Object.entries(payload.torrents)) {
                candidates.push({ hash, ...(item || {}) });
            }
        } else if (payload && typeof payload === "object") {
            const values = Object.entries(payload);

            if (values.length && values.every(([, item]) => item && typeof item === "object")) {
                for (const [hash, item] of values) {
                    candidates.push({ hash, ...(item || {}) });
                }
            }
        }

        return candidates.map(item => ({
            hash: String(
                item.hash ||
                item.hashString ||
                item.hash_string ||
                item.infoHash ||
                ""
            ).toLowerCase(),
            name: item.name || item.title || "",
            content_path:
                item.directory ||
                item.downloadDir ||
                item.download_dir ||
                item.basePath ||
                "",
            files: Array.isArray(item.files)
                ? item.files.map(file => ({
                    name: file.path || file.name || "",
                    size: file.size || file.length || 0
                }))
                : []
        }));
    }

    async function listFloodTorrents(config = CONFIG) {
        await floodEnsureSession(config);
        const payload = await floodRequest(config, "GET", "/api/torrents");
        return normalizeFloodTorrentList(payload);
    }

    async function addFloodTorrent(buffer, filename, config = CONFIG, context = {}) {
        await floodEnsureSession(config);

        const tags = combinedOrganizationLabels(
            parseCommaList(config.floodTags),
            context,
            config
        );

        const hashes = await floodRequest(
            config,
            "POST",
            "/api/torrents/add-files",
            {
                files: [arrayBufferToBase64(buffer)],
                tags,
                start: Boolean(config.forceStart)
            }
        );

        return {
            duplicate: false,
            hash: Array.isArray(hashes) ? String(hashes[0] || "").toLowerCase() : ""
        };
    }

    // ---------- Generic selected-client abstraction ----------

    async function testClient(config = CONFIG) {
        switch (getClientType(config)) {
            case "rtorrent":
                return testRtorrent(config);
            case "transmission":
                return testTransmission(config);
            case "deluge":
                return testDeluge(config);
            case "flood":
                return testFlood(config);
            default:
                return testQbit(config);
        }
    }

    async function listSelectedClientTorrents(config = CONFIG) {
        switch (getClientType(config)) {
            case "rtorrent":
                return listRtorrentTorrents(config);
            case "transmission":
                return listTransmissionTorrents(config);
            case "deluge":
                return listDelugeTorrents(config);
            case "flood":
                return listFloodTorrents(config);
            default: {
                const qbit = await listQbitTorrents(config);
                return qbit.map(item => ({
                    hash: String(item.hash || "").toLowerCase(),
                    name: item.name || "",
                    content_path: item.content_path || "",
                    files: []
                }));
            }
        }
    }

    async function findExactInSelectedClient(hashes, config = CONFIG) {
        if (getClientType(config) === "qbittorrent") {
            const found = await findQbitHash(hashes, config);
            return found
                ? { hash: found.hash, torrent: found.torrent }
                : null;
        }

        const all = await listSelectedClientTorrents(config);
        const candidates = new Set([
            String(hashes.v1 || "").toLowerCase(),
            String(hashes.v2 || "").toLowerCase()
        ]);

        const found = all.find(item => candidates.has(String(item.hash || "").toLowerCase()));
        return found ? { hash: found.hash, torrent: found } : null;
    }

    async function findSimilarInSelectedClient(targetName, targetResolution, config = CONFIG) {
        if (!config.checkSimilarInQbit || !targetName) {
            return [];
        }

        if (getClientType(config) === "qbittorrent") {
            return findSimilarInQbit(targetName, targetResolution, config);
        }

        const all = await listSelectedClientTorrents(config);
        const matches = [];

        for (const torrent of all) {
            let score = Math.max(
                similarity(targetName, torrent.name || ""),
                similarity(targetName, torrent.content_path || "")
            );

            let resolution =
                detectResolutionFromText(torrent.name || "") ||
                detectResolutionFromText(torrent.content_path || "");

            for (const file of torrent.files || []) {
                score = Math.max(score, similarity(targetName, file.name || ""));

                if (!resolution && isVideoFile(file.name)) {
                    resolution = detectResolutionFromText(file.name);
                }
            }

            if (score >= 0.48) {
                matches.push({
                    hash: torrent.hash,
                    name: torrent.name || torrent.content_path || "(sans nom)",
                    score,
                    resolution,
                    files: torrent.files || []
                });
            }
        }

        return matches.sort((a, b) => {
            const qa = a.resolution?.value || 0;
            const qb = b.resolution?.value || 0;
            if (qa !== qb) return qb - qa;
            return b.score - a.score;
        });
    }

    async function addBufferToSelectedClient(buffer, filename, hashes, config = CONFIG, context = {}) {
        switch (getClientType(config)) {
            case "rtorrent":
                return addRtorrentTorrent(buffer, filename, config, context);
            case "transmission":
                return addTransmissionTorrent(buffer, filename, config, context);
            case "deluge":
                return addDelugeTorrent(buffer, filename, config, context);
            case "flood":
                return addFloodTorrent(buffer, filename, config, context);
            default: {
                const upload = await uploadTorrent(buffer, filename, config, context);

                if (upload.conflict) {
                    const found = await waitForTorrent(hashes, config);
                    return {
                        duplicate: Boolean(found),
                        hash: found?.hash || "",
                        conflictWithoutMatch: !found
                    };
                }

                const found = await waitForTorrent(hashes, config);

                if (!found) {
                    throw new Error("Torrent envoyé mais introuvable dans qBitTorrent");
                }

                if (config.forceStart) {
                    await forceStart(found.hash, config);
                }

                return {
                    duplicate: false,
                    hash: found.hash
                };
            }
        }
    }

    async function findSimilarAcrossClients(targetName, targetResolution) {
        const profiles = getClientProfiles();

        const settled = await Promise.allSettled(
            profiles.map(async profile => {
                const runtime = clientRuntimeConfig(profile);
                const matches = await findSimilarInSelectedClient(
                    targetName,
                    targetResolution,
                    runtime
                );

                return matches.map(item => ({
                    ...item,
                    clientId: profile.id,
                    clientName: getClientDisplayName(profile),
                    clientProfile: profile
                }));
            })
        );

        return settled.flatMap(item =>
            item.status === "fulfilled" ? item.value : []
        );
    }

    function renderClientTargetButtons({
        action,
        providerId = "",
        resultUrl = ""
    } = {}) {
        const clients = getClientProfiles();

        if (!clients.length) return "";

        return `
            <span class="qbd-client-targets">
                ${clients.map(client => {
                    const clientName = getClientDisplayName(client);

                    return `
                        <button type="button"
                                class="qbd-client-target"
                                style="--client-color:${escapeHtml(client.color || "#8b5cf6")}"
                                data-client-id="${escapeHtml(client.id)}"
                                ${action === "result"
                                    ? `data-pornscout-send-result="1"
                                       data-provider-id="${escapeHtml(providerId)}"
                                       data-result-url="${escapeHtml(resultUrl)}"`
                                    : `data-pornscout-send-current="1"`}
                                title="${escapeHtml(t("sendToClientTooltip", { client: clientName }))}"
                                aria-label="${escapeHtml(t("sendToClientTooltip", { client: clientName }))}">
                            <span class="qbd-client-target-name">${escapeHtml(clientName)}</span>
                            <span class="qbd-client-target-arrow" aria-hidden="true">→</span>
                        </button>
                    `;
                }).join("")}
            </span>
        `;
    }


    // ============================================================
    // BENCODE / MÉTADONNÉES TORRENT
    // ============================================================

    function readString(data, pos) {
        let length = 0;

        while (data[pos] !== 0x3a) {
            if (data[pos] < 0x30 || data[pos] > 0x39) {
                throw new Error("Chaîne bencode invalide");
            }

            length = length * 10 + (data[pos] - 0x30);
            pos++;
        }

        const start = pos + 1;
        const end = start + length;

        return {
            bytes: data.slice(start, end),
            value: new TextDecoder().decode(data.slice(start, end)),
            end
        };
    }

    function skipBencode(data, pos) {
        const byte = data[pos];

        // Integer
        if (byte === 0x69) {
            pos++;
            while (data[pos] !== 0x65) pos++;
            return pos + 1;
        }

        // List
        if (byte === 0x6c) {
            pos++;
            while (data[pos] !== 0x65) {
                pos = skipBencode(data, pos);
            }
            return pos + 1;
        }

        // Dictionary
        if (byte === 0x64) {
            pos++;
            while (data[pos] !== 0x65) {
                pos = skipBencode(data, pos); // key
                pos = skipBencode(data, pos); // value
            }
            return pos + 1;
        }

        // String
        if (byte >= 0x30 && byte <= 0x39) {
            let length = 0;
            while (data[pos] !== 0x3a) {
                length = length * 10 + (data[pos] - 0x30);
                pos++;
            }
            return pos + 1 + length;
        }

        throw new Error("Bencode invalide à l'offset " + pos);
    }

    function findInfoDictionary(buffer) {
        const data = new Uint8Array(buffer);

        if (data[0] !== 0x64) {
            throw new Error("Le fichier reçu n'est pas un torrent bencode valide");
        }

        let pos = 1;

        while (data[pos] !== 0x65) {
            const key = readString(data, pos);
            pos = key.end;

            if (key.value === "info") {
                const start = pos;
                const end = skipBencode(data, pos);
                return data.slice(start, end);
            }

            pos = skipBencode(data, pos);
        }

        throw new Error("Dictionnaire 'info' introuvable");
    }

    function parseStringList(data, pos) {
        const values = [];

        if (data[pos] !== 0x6c) {
            return { values, end: skipBencode(data, pos) };
        }

        pos++;

        while (data[pos] !== 0x65) {
            if (data[pos] >= 0x30 && data[pos] <= 0x39) {
                const part = readString(data, pos);
                values.push(part.value);
                pos = part.end;
            } else {
                pos = skipBencode(data, pos);
            }
        }

        return { values, end: pos + 1 };
    }

    function parseFilesList(data, pos) {
        const files = [];

        if (data[pos] !== 0x6c) {
            return { files, end: skipBencode(data, pos) };
        }

        pos++;

        while (data[pos] !== 0x65) {
            if (data[pos] !== 0x64) {
                pos = skipBencode(data, pos);
                continue;
            }

            pos++;
            let pathParts = [];
            let utf8PathParts = [];

            while (data[pos] !== 0x65) {
                const key = readString(data, pos);
                pos = key.end;

                if (key.value === "path") {
                    const list = parseStringList(data, pos);
                    pathParts = list.values;
                    pos = list.end;
                } else if (key.value === "path.utf-8") {
                    const list = parseStringList(data, pos);
                    utf8PathParts = list.values;
                    pos = list.end;
                } else {
                    pos = skipBencode(data, pos);
                }
            }

            pos++;
            const path = (utf8PathParts.length ? utf8PathParts : pathParts).join("/");

            if (path) {
                files.push(path);
            }
        }

        return { files, end: pos + 1 };
    }

    function parseInfoMetadata(infoBytes) {
        const data = infoBytes;
        const metadata = {
            name: "",
            files: []
        };

        if (!data || data[0] !== 0x64) {
            return metadata;
        }

        let pos = 1;
        let name = "";
        let utf8Name = "";

        while (data[pos] !== 0x65) {
            const key = readString(data, pos);
            pos = key.end;

            if (key.value === "name") {
                const value = readString(data, pos);
                name = value.value;
                pos = value.end;
            } else if (key.value === "name.utf-8") {
                const value = readString(data, pos);
                utf8Name = value.value;
                pos = value.end;
            } else if (key.value === "files") {
                const parsed = parseFilesList(data, pos);
                metadata.files.push(...parsed.files);
                pos = parsed.end;
            } else {
                pos = skipBencode(data, pos);
            }
        }

        metadata.name = utf8Name || name || "";

        // Torrent mono-fichier : le nom de "info" est aussi le nom du fichier.
        if (!metadata.files.length && metadata.name) {
            metadata.files.push(metadata.name);
        }

        return metadata;
    }

    function bytesToHex(buffer) {
        return [...new Uint8Array(buffer)]
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    async function calculateHashes(buffer) {
        const info = findInfoDictionary(buffer);

        const [sha1, sha256] = await Promise.all([
            crypto.subtle.digest("SHA-1", info),
            crypto.subtle.digest("SHA-256", info)
        ]);

        return {
            v1: bytesToHex(sha1),
            v2: bytesToHex(sha256),
            info
        };
    }

    // ============================================================
    // TÉLÉCHARGEMENT DU .TORRENT
    // ============================================================

    function getFilename(response, originalUrl) {
        const headers = response.responseHeaders || "";

        const disposition = headers.match(
            /content-disposition:[^\r\n]*filename\*?=(?:UTF-8''|")?([^"\r\n;]+)/i
        );

        if (disposition) {
            let filename = disposition[1].trim().replace(/^["']|["']$/g, "");

            try {
                filename = decodeURIComponent(filename);
            } catch (_) {}

            if (!filename.toLowerCase().endsWith(".torrent")) {
                filename += ".torrent";
            }

            return filename;
        }

        try {
            const parsed = new URL(originalUrl);
            const last = parsed.pathname.split("/").filter(Boolean).pop();

            if (last && last.toLowerCase().endsWith(".torrent")) {
                return decodeURIComponent(last);
            }
        } catch (_) {}

        return "download.torrent";
    }

    async function fetchTorrent(url) {
        log("Téléchargement .torrent", url);

        const response = await gmRequest({
            method: "GET",
            url,
            responseType: "arraybuffer",
            anonymous: false,
            withCredentials: true,
            timeout: 30000
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error("Téléchargement torrent HTTP " + response.status);
        }

        const buffer = response.response;

        if (!buffer || buffer.byteLength < 20) {
            throw new Error("Torrent reçu vide");
        }

        if (new Uint8Array(buffer)[0] !== 0x64) {
            throw new Error("Le site n'a pas renvoyé un fichier .torrent");
        }

        return {
            buffer,
            filename: getFilename(response, url)
        };
    }

    // ============================================================
    // QUALITÉ / IDENTITÉ
    // ============================================================

    const VIDEO_EXT_RE = /\.(mkv|mp4|m4v|avi|mov|wmv|ts|m2ts|webm|mpg|mpeg)$/i;

    function detectResolutionFromText(text) {
        const source = String(text || "");

        if (!source.trim()) {
            return null;
        }

        // Dimensions explicites
        const dimensions = source.match(/\b(\d{2,4})\s*(?:px)?\s*[x×*]\s*(\d{2,4})\s*(?:px)?\b/i);
        if (dimensions) {
            const width = Number(dimensions[1]);
            const height = Number(dimensions[2]);
            const vertical = Math.min(width, height);
            const category =
                /\b(?:8k)\b/i.test(source) ? "8K" :
                /\b(?:4k|uhd)\b/i.test(source) ? "4K" :
                /\bfhd\b/i.test(source) ? "FHD" :
                /\bhd\b/i.test(source) ? "HD" :
                /\bsd\b/i.test(source) ? "SD" :
                "";

            // Les dimensions explicites sont la source la plus fiable.
            // Même 512x224 doit être exploité : 224 < 1080, donc le quality gate s'active.
            return {
                value: vertical,
                width,
                height,
                category,
                token: dimensions[0],
                confidence: "high"
            };
        }

        const explicit = source.match(/\b(4320|2160|1440|1080|720|576|540|480|360)p\b/i);
        if (explicit) {
            return { value: Number(explicit[1]), token: explicit[0], confidence: "high" };
        }

        if (/\b(8k)\b/i.test(source)) {
            return { value: 4320, token: "8K", confidence: "medium" };
        }

        if (/\b(4k|uhd)\b/i.test(source)) {
            return { value: 2160, token: source.match(/\b(4k|uhd)\b/i)[0], confidence: "medium" };
        }

        if (/\b(fhd|full[\s._-]*hd)\b/i.test(source)) {
            return { value: 1080, token: "FHD", confidence: "medium", category: "FHD" };
        }

        if (/\b(sd|standard[\s._-]*definition)\b/i.test(source)) {
            // "SD" suffit à savoir que l'on est sous 1080p, même sans dimensions.
            return { value: 480, token: "SD", confidence: "medium", category: "SD" };
        }

        // "HD" seul reste volontairement ambigu.
        return null;
    }

    function detectSizeFromText(text) {
        const source = String(text || "");

        if (!source.trim()) {
            return null;
        }

        // Binary units first (common on private trackers).
        const binary = source.match(/\b(\d+(?:[.,]\d+)?)\s*(KiB|MiB|GiB|TiB)\b/i);
        if (binary) {
            return {
                value: Number(binary[1].replace(",", ".")),
                unit: binary[2],
                text: `${binary[1]} ${binary[2]}`
            };
        }

        // Decimal units fallback.
        const decimal = source.match(/\b(\d+(?:[.,]\d+)?)\s*(KB|MB|GB|TB)\b/i);
        if (decimal) {
            return {
                value: Number(decimal[1].replace(",", ".")),
                unit: decimal[2],
                text: `${decimal[1]} ${decimal[2]}`
            };
        }

        return null;
    }

    function sizeToGiB(size) {
        if (!size || !Number.isFinite(Number(size.value))) {
            return null;
        }

        const value = Number(size.value);
        const unit = String(size.unit || "").toLowerCase();

        switch (unit) {
            case "tib": return value * 1024;
            case "gib": return value;
            case "mib": return value / 1024;
            case "kib": return value / (1024 * 1024);
            case "tb": return value * 1000;
            case "gb": return value * (1000 ** 3) / (1024 ** 3);
            case "mb": return value * (1000 ** 2) / (1024 ** 3);
            case "kb": return value * 1000 / (1024 ** 3);
            default: return null;
        }
    }

    function detectCodecFromText(text) {
        const source = String(text || "");

        if (/\b(?:av1|aomedia)\b/i.test(source)) return "AV1";
        if (/\b(?:hevc|h[ ._-]?265|x265)\b/i.test(source)) return "HEVC";
        if (/\b(?:avc|h[ ._-]?264|x264)\b/i.test(source)) return "AVC";
        if (/\bvp9\b/i.test(source)) return "VP9";
        if (/\b(?:mpeg[- ]?4 visual|xvid|divx)\b/i.test(source)) return "MPEG-4 Visual";
        if (/\b(?:mpeg[- ]?2)\b/i.test(source)) return "MPEG-2";
        return null;
    }

    function detectSourceFromText(text) {
        const source = String(text || "");

        if (/\bremux\b/i.test(source)) return "REMUX";
        if (/\b(?:web[ ._-]?dl)\b/i.test(source)) return "WEB-DL";
        if (/\b(?:web[ ._-]?rip)\b/i.test(source)) return "WEBRip";
        if (/\b(?:blu[ ._-]?ray|bluray|bdremux|bdrip|brrip)\b/i.test(source)) return "BluRay";
        if (/\bhdtv\b/i.test(source)) return "HDTV";
        if (/\b(?:dvd(?:rip)?|dvdrip)\b/i.test(source)) return "DVD";
        if (/\b(?:encode|re-?encode)\b/i.test(source)) return "Encode";
        return null;
    }

    function detectSeedersFromText(text) {
        const source = String(text || "");

        const labelled = source.match(/\b(\d{1,7})\s*(?:seeders?|seeds?)\b/i);
        if (labelled) {
            return Number(labelled[1]);
        }

        return null;
    }

    function detectSeedersFromElement(element) {
        if (!element) return null;

        const dataValue =
            element.getAttribute?.("data-seeders") ||
            element.querySelector?.("[data-seeders]")?.getAttribute("data-seeders");

        if (dataValue != null && /^\d+$/.test(String(dataValue).trim())) {
            return Number(dataValue);
        }

        const seedNode =
            element.querySelector?.('[class*="seed" i]') ||
            element.querySelector?.('[id*="seed" i]');

        if (seedNode) {
            const match = String(seedNode.textContent || "").match(/\d+/);
            if (match) return Number(match[0]);
        }

        const titled = [...(element.querySelectorAll?.("[title]") || [])]
            .find(node => /\bseeders?\b/i.test(node.getAttribute("title") || ""));

        if (titled) {
            const match = String(titled.getAttribute("title") || "").match(/\b(\d+)\b/);
            if (match) return Number(match[1]);
        }

        return detectSeedersFromText(element.textContent || "");
    }

    function detectCurrentPageReleaseMetadata(metadata, torrentFilename, resolution) {
        const pageText = String(document.body?.innerText || "").slice(0, 16000);
        const names = [
            metadata?.name || "",
            ...(metadata?.files || []).filter(isVideoFile).slice(0, 12),
            torrentFilename || "",
            document.querySelector("h1")?.textContent || "",
            document.title || ""
        ].join(" ");

        return {
            resolution: resolution || detectResolutionFromText(names) || detectResolutionFromText(pageText),
            size: detectSizeFromText(pageText) || detectSizeFromText(names),
            codec: detectCodecFromText(names) || detectCodecFromText(pageText),
            source: detectSourceFromText(names) || detectSourceFromText(pageText),
            seeders: detectSeedersFromElement(document.body)
        };
    }

    function extractTrackerDetailMetadata(html, finalUrl, fallbackTitle = "") {
        if (!html) {
            return {
                resolution: null,
                size: null
            };
        }

        const doc = new DOMParser().parseFromString(html, "text/html");

        const textCandidates = [];

        function add(label, value) {
            const text = String(value || "").replace(/\s+/g, " ").trim();
            if (text) {
                textCandidates.push({ label, text });
            }
        }

        // Explicit fields first.
        const bodyText = String(doc.body?.innerText || "");

        for (const line of bodyText.split(/\n+/)) {
            const normalized = line.replace(/\s+/g, " ").trim();

            if (/^resolution\s*:/i.test(normalized)) {
                textCandidates.unshift({
                    label: "Resolution",
                    text: normalized
                });
            }

            if (/^size\s*:/i.test(normalized)) {
                textCandidates.unshift({
                    label: "Size",
                    text: normalized
                });
            }
        }

        // Main page title / heading.
        add("fallback title", fallbackTitle);
        add("h1", doc.querySelector("h1")?.textContent);
        add("h2", doc.querySelector("h2")?.textContent);
        add("og:title", doc.querySelector('meta[property="og:title"]')?.getAttribute("content"));
        add("title", doc.title);

        // A limited beginning of body is safer than scanning the whole page,
        // which may contain unrelated recommendations.
        add("body start", bodyText.slice(0, 8000));

        let resolution = null;
        let size = null;
        let codec = null;
        let source = null;

        for (const candidate of textCandidates) {
            if (!resolution) {
                resolution = detectResolutionFromText(candidate.text);
                if (resolution) {
                    resolution = {
                        ...resolution,
                        source: candidate.label
                    };
                }
            }

            if (!size) {
                size = detectSizeFromText(candidate.text);
            }

            if (!codec) {
                codec = detectCodecFromText(candidate.text);
            }

            if (!source) {
                source = detectSourceFromText(candidate.text);
            }

            if (resolution && size && codec && source) {
                break;
            }
        }

        const seeders = detectSeedersFromElement(doc.body);

        return {
            resolution,
            size,
            codec,
            source,
            seeders,
            finalUrl
        };
    }

    async function enrichTrackerResult(provider, result) {
        // First use what was already found in the search result row.
        if (
            result.resolution &&
            result.size &&
            result.codec &&
            result.source &&
            Number.isFinite(result.seeders)
        ) {
            return result;
        }

        try {
            const response = await trackerRequest(provider, result.url);

            if (
                response.status < 200 ||
                response.status >= 400 ||
                looksLikeLoginPage(response.responseText, response.finalUrl || result.url)
            ) {
                return result;
            }

            const metadata = extractTrackerDetailMetadata(
                response.responseText,
                response.finalUrl || result.url,
                result.title
            );

            return {
                ...result,
                resolution: result.resolution || metadata.resolution,
                size: result.size || metadata.size,
                codec: result.codec || metadata.codec,
                source: result.source || metadata.source,
                seeders: Number.isFinite(result.seeders) ? result.seeders : metadata.seeders,
                detailChecked: true
            };
        } catch (error) {
            log("Impossible d'enrichir la fiche torrent", provider.label, result.url, error);
            return result;
        }
    }

    async function enrichTrackerResults(provider, results) {
        // Avoid hammering trackers. We enrich only the results shown in the UI.
        const limited = results.slice(0, 8);

        return Promise.all(
            limited.map(result => enrichTrackerResult(provider, result))
        );
    }

    function chooseBestResolution(sources) {
        for (const source of sources) {
            if (!source || !source.text) continue;

            const detected = detectResolutionFromText(source.text);

            if (detected) {
                return {
                    ...detected,
                    source: source.label
                };
            }
        }

        return null;
    }

    function getExplicitResolutionTexts() {
        const results = [];
        const seen = new Set();

        function add(value) {
            const text = String(value || "").replace(/\s+/g, " ").trim();

            if (!text || seen.has(text)) {
                return;
            }

            seen.add(text);
            results.push({
                label: "champ Resolution de la page",
                text
            });
        }

        // Exemple pris en charge :
        // Resolution: HD (1280px * 720px)
        const bodyText = String(document.body?.innerText || "");

        for (const line of bodyText.split(/\n+/)) {
            const normalized = line.trim();

            if (/^\s*resolution\s*:/i.test(normalized)) {
                add(normalized);
            }
        }

        // Certains thèmes séparent "Resolution" de sa valeur.
        const nodes = [...document.querySelectorAll("td, th, dt, dd, li, div, span, p")];

        for (const node of nodes) {
            const ownText = String(node.textContent || "").replace(/\s+/g, " ").trim();

            if (!/^resolution\s*:?\s*$/i.test(ownText) && !/^resolution\s*:/i.test(ownText)) {
                continue;
            }

            add(ownText);

            const sibling = node.nextElementSibling;
            if (sibling) {
                add("Resolution: " + String(sibling.textContent || "").replace(/\s+/g, " ").trim());
            }

            const parentText = node.parentElement?.textContent;
            if (parentText) {
                add(String(parentText).replace(/\s+/g, " ").trim());
            }
        }

        return results;
    }

    function getPageReleaseTexts() {
        const texts = [];
        const seen = new Set();

        function add(label, value) {
            const text = String(value || "").replace(/\s+/g, " ").trim();

            if (!text || seen.has(text)) {
                return;
            }

            seen.add(text);
            texts.push({ label, text });
        }

        [
            "h1",
            "h2",
            ".torrent_title",
            ".torrent-title",
            ".torrentname",
            ".torrent-name",
            ".panel__heading__title",
            ".page__title",
            "[data-testid*='title']",
            "title"
        ].forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(node => {
                    add(selector === "title" ? "titre de page" : "titre de la page", node.textContent);
                });
            } catch (_) {}
        });

        add("document.title", document.title);

        // On ne scanne qu'un extrait du body pour éviter les faux positifs et les énormes pages.
        const bodyText = String(document.body?.innerText || "").slice(0, 16000);
        add("texte de la page", bodyText);

        return texts;
    }

    const NOISE_PATTERNS = [
        /\b(?:4320|2160|1440|1080|720|576|540|480|360)p\b/gi,
        /\b(?:8k|4k|uhd|fhd|full[\s._-]*hd)\b/gi,
        /\b(?:web[\s._-]*dl|webrip|web|bluray|blu[\s._-]*ray|bdrip|brrip|hdrip|dvdrip|hdtv|remux)\b/gi,
        /\b(?:x264|x265|h264|h265|hevc|av1|avc|xvid|divx)\b/gi,
        /\b(?:hdr10\+?|hdr|dolby[\s._-]*vision|dovi|dv)\b/gi,
        /\b(?:aac\d*|ac3|eac3|ddp\d*|dts(?:hd)?|truehd|atmos|flac|mp3)\b/gi,
        /\b(?:french|truefrench|multi|multilang|vostfr|subfrench|vo|vf|vff|vfq)\b/gi,
        /\b(?:proper|repack|internal|limited|uncut|extended|complete)\b/gi,
        /\b(?:10bit|8bit)\b/gi
    ];

    function cleanReleaseName(value) {
        let text = String(value || "");

        try {
            text = decodeURIComponent(text);
        } catch (_) {}

        text = text
            .replace(/\.(torrent|mkv|mp4|m4v|avi|mov|wmv|ts|m2ts|webm)$/i, "")
            .replace(/[\[\](){}]/g, " ")
            .replace(/[._]+/g, " ")
            .replace(/\s+-\s+[A-Za-z0-9]{2,20}$/g, " ");

        for (const pattern of NOISE_PATTERNS) {
            text = text.replace(pattern, " ");
        }

        return text
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function tokenSet(value) {
        return new Set(
            cleanReleaseName(value)
                .split(/\s+/)
                .filter(token => token.length >= 2)
        );
    }

    function similarity(a, b) {
        const A = tokenSet(a);
        const B = tokenSet(b);

        if (!A.size || !B.size) {
            return 0;
        }

        let common = 0;
        for (const token of A) {
            if (B.has(token)) common++;
        }

        const union = new Set([...A, ...B]).size;
        const jaccard = union ? common / union : 0;

        // Couverture du titre cible : utile pour les lignes de tracker qui contiennent
        // beaucoup de métadonnées supplémentaires.
        const coverage = common / A.size;

        const ca = cleanReleaseName(a);
        const cb = cleanReleaseName(b);
        const containment =
            ca.length >= 6 &&
            cb.length >= 6 &&
            (ca.includes(cb) || cb.includes(ca));

        return Math.min(
            1,
            Math.max(jaccard, coverage * 0.92) + (containment ? 0.12 : 0)
        );
    }

    function isVideoFile(name) {
        return VIDEO_EXT_RE.test(String(name || ""));
    }

    function isUsefulIdentity(value) {
        const raw = String(value || "").replace(/\s+/g, " ").trim();

        if (!raw || raw.length < 4) {
            return false;
        }

        // Un ID torrent numérique n'est jamais une identité de contenu exploitable.
        if (/^\d+$/.test(raw)) {
            return false;
        }

        // Il faut au moins quelques lettres.
        if (!/\p{L}{3}/u.test(raw)) {
            return false;
        }

        const cleaned = cleanReleaseName(raw);

        if (!cleaned || cleaned.length < 4 || /^\d+$/.test(cleaned)) {
            return false;
        }

        const generic = [
            "download torrent",
            "torrent download",
            "browse torrents",
            "torrents",
            "torrent",
            "home",
            "index",
            "kufirc",
            "empornium",
            "emparadise",
            "happyfappy",
            "bitporn",
            "exoticaz",
            "sextorrent"
        ];

        return !generic.includes(cleaned);
    }

    function scoreIdentityCandidate(value, source = "") {
        if (!isUsefulIdentity(value)) {
            return -1000;
        }

        const raw = String(value).replace(/\s+/g, " ").trim();
        const cleaned = cleanReleaseName(raw);
        const tokens = cleaned.split(/\s+/).filter(Boolean);

        let score = Math.min(50, raw.length / 3);
        score += Math.min(30, tokens.length * 4);

        if (/\b(19|20)\d{2}\b/.test(raw)) score += 8;
        if (/\bS\d{1,2}E\d{1,3}\b/i.test(raw)) score += 10;
        if (/og:title|heading|row-link/i.test(source)) score += 12;
        if (/document-title/i.test(source)) score += 5;

        // Les longues lignes contenant toute une fiche sont moins bonnes qu'un vrai titre.
        if (raw.length > 220) score -= 25;

        return score;
    }

    function stripSiteBrand(value) {
        return String(value || "")
            .replace(/\s*(?:[-|•·:]{1,3})\s*(?:Kufirc|Empornium|EmParadise|HappyFappy|BitPorn|ExoticaZ|SexTorrent).*$/i, "")
            .replace(/^(?:Kufirc|Empornium|EmParadise|HappyFappy|BitPorn|ExoticaZ|SexTorrent)\s*(?:[-|•·:]{1,3})\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function capturePageContext(downloadAnchor) {
        const candidates = [];

        function add(source, value) {
            const raw = stripSiteBrand(value);
            const score = scoreIdentityCandidate(raw, source);

            if (score > -1000) {
                candidates.push({ source, value: raw, score });
            }
        }

        // 1) Le lien/torrent row autour du bouton cliqué : très utile sur Gazelle.
        if (downloadAnchor instanceof Element) {
            const row = downloadAnchor.closest(
                "tr.group_torrent, tr.torrent, tr[class*='torrent'], .torrent, .torrent-row, article, li"
            );

            if (row) {
                const rowLinks = [...row.querySelectorAll("a[href]")];

                for (const link of rowLinks) {
                    const href = link.getAttribute("href") || "";
                    const label = String(link.textContent || "").replace(/\s+/g, " ").trim();

                    if (
                        label &&
                        !/download/i.test(label) &&
                        !/^(?:dl|torrent|\d+)$/i.test(label) &&
                        (
                            /torrents?\.php\?id=/i.test(href) ||
                            /torrentid=/i.test(href) ||
                            /details|view/i.test(href)
                        )
                    ) {
                        add("row-link", label);
                    }
                }

                add("torrent-row", row.innerText);
            }
        }

        // 2) Métadonnées/titres de page.
        const metaOg = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
        add("og:title", metaOg);

        [
            "h1",
            "#content h2",
            ".thin h2",
            ".torrent_title",
            ".torrent-title",
            ".page__title",
            ".panel__heading__title"
        ].forEach(selector => {
            document.querySelectorAll(selector).forEach(node => {
                add("heading", node.textContent);
            });
        });

        add("document-title", document.title);

        candidates.sort((a, b) => b.score - a.score);

        return {
            identity: candidates[0]?.value || "",
            candidates: candidates.slice(0, 8),
            pageUrl: location.href,
            host: location.hostname
        };
    }

    function deriveTargetIdentity(metadata, torrentFilename, pageContext = null) {
        // La page du tracker est désormais prioritaire.
        if (pageContext?.identity && isUsefulIdentity(pageContext.identity)) {
            return pageContext.identity;
        }

        // Ne jamais accepter un nom interne purement numérique comme "4895806".
        if (isUsefulIdentity(metadata.name)) {
            return metadata.name;
        }

        const video = metadata.files.find(name => isVideoFile(name) && isUsefulIdentity(name));
        if (video) {
            return video.split("/").pop();
        }

        if (isUsefulIdentity(torrentFilename)) {
            return torrentFilename;
        }

        if (isUsefulIdentity(document.title)) {
            return stripSiteBrand(document.title);
        }

        return "";
    }

    function detectTargetResolution(metadata, torrentFilename) {
        const explicitResolutionTexts = getExplicitResolutionTexts();
        const pageTexts = getPageReleaseTexts();

        const sources = [
            // Le champ explicite de la fiche torrent est prioritaire.
            ...explicitResolutionTexts,
            { label: "nom du torrent", text: metadata.name },
            ...metadata.files.filter(isVideoFile).slice(0, 12).map(name => ({
                label: "nom de fichier vidéo",
                text: name
            })),
            { label: "nom du fichier .torrent", text: torrentFilename },
            ...pageTexts
        ];

        return chooseBestResolution(sources);
    }

    function formatResolution(resolution) {
        if (!resolution) return "inconnue";

        if (resolution.width && resolution.height) {
            const prefix = resolution.category ? resolution.category + " — " : "";
            return `${prefix}${resolution.width}×${resolution.height} (${resolution.value}p)`;
        }

        if (Number(resolution.value) === 2160) return "2160p / 4K";
        if (resolution.category === "SD") return "SD";
        return resolution.value + "p";
    }

    // ============================================================
    // QBITTORRENT : EXACT + CONTENU SIMILAIRE
    // ============================================================

    async function torrentExists(hash, config = CONFIG) {
        const response = await qbitGet(
            "/api/v2/torrents/info?hashes=" + encodeURIComponent(hash),
            config
        );

        try {
            const torrents = JSON.parse(response.responseText);
            return Array.isArray(torrents) && torrents.length ? torrents[0] : null;
        } catch (_) {
            return null;
        }
    }

    async function findQbitHash(hashes, config = CONFIG) {
        const v1 = await torrentExists(hashes.v1, config);
        if (v1) return { hash: hashes.v1, torrent: v1 };

        const v2 = await torrentExists(hashes.v2, config);
        if (v2) return { hash: hashes.v2, torrent: v2 };

        return null;
    }

    async function listQbitTorrents(config = CONFIG) {
        const response = await qbitGet(
            "/api/v2/torrents/info?filter=all&sort=added_on&reverse=true",
            config
        );

        try {
            const torrents = JSON.parse(response.responseText);
            return Array.isArray(torrents) ? torrents : [];
        } catch (_) {
            return [];
        }
    }

    async function getQbitFiles(hash, config = CONFIG) {
        try {
            const response = await qbitGet(
                "/api/v2/torrents/files?hash=" + encodeURIComponent(hash),
                config,
                10000
            );

            const files = JSON.parse(response.responseText);
            return Array.isArray(files) ? files : [];
        } catch (error) {
            log("Impossible de lire les fichiers qBitTorrent", hash, error);
            return [];
        }
    }

    async function findSimilarInQbit(targetName, targetResolution, config = CONFIG) {
        if (!config.checkSimilarInQbit || !targetName) {
            return [];
        }

        const all = await listQbitTorrents(config);

        // qBitTorrent expose généralement content_path dans torrents/info.
        // C'est crucial pour les trackers dont le "name" interne du torrent est un ID numérique.
        let candidates = all
            .map(torrent => {
                const searchable = [
                    torrent.name || "",
                    torrent.content_path || ""
                ].join(" ");

                return {
                    torrent,
                    searchable,
                    score: similarity(targetName, searchable)
                };
            })
            .filter(item => item.score >= 0.40)
            .sort((a, b) => b.score - a.score)
            .slice(0, 18);

        // Si aucun candidat ne ressort par name/content_path, inspecter également
        // quelques torrents à nom numérique/faible information : fréquent sur Kufirc-like.
        if (!candidates.length) {
            candidates = all
                .filter(torrent => {
                    const name = String(torrent.name || "").trim();
                    return /^\d+$/.test(name) || !isUsefulIdentity(name);
                })
                .slice(0, 35)
                .map(torrent => ({
                    torrent,
                    searchable: [torrent.name || "", torrent.content_path || ""].join(" "),
                    score: similarity(targetName, torrent.content_path || "")
                }));
        }

        const enriched = [];

        for (const item of candidates) {
            let files = [];
            let resolution =
                detectResolutionFromText(item.torrent.name || "") ||
                detectResolutionFromText(item.torrent.content_path || "");

            // Lire les fichiers dès que le nom du torrent est numérique ou que
            // la correspondance reste moyenne.
            const suspiciousName = /^\d+$/.test(String(item.torrent.name || "").trim());

            if (suspiciousName || item.score < 0.72 || !resolution) {
                files = await getQbitFiles(item.torrent.hash, config);

                let bestFileScore = item.score;

                for (const file of files) {
                    const score = similarity(targetName, file.name || "");
                    if (score > bestFileScore) {
                        bestFileScore = score;
                    }

                    if (!resolution && isVideoFile(file.name)) {
                        resolution = detectResolutionFromText(file.name);
                    }
                }

                item.score = bestFileScore;
            }

            if (item.score >= 0.48) {
                const usefulFile =
                    files
                        .filter(file => isVideoFile(file.name))
                        .sort((a, b) =>
                            similarity(targetName, b.name || "") -
                            similarity(targetName, a.name || "")
                        )[0]?.name || "";

                enriched.push({
                    hash: item.torrent.hash,
                    name:
                        (isUsefulIdentity(item.torrent.name) ? item.torrent.name : "") ||
                        usefulFile ||
                        item.torrent.content_path ||
                        item.torrent.name ||
                        "(sans nom)",
                    score: item.score,
                    resolution,
                    files
                });
            }
        }

        return enriched.sort((a, b) => {
            const qa = a.resolution?.value || 0;
            const qb = b.resolution?.value || 0;

            if (qa !== qb) return qb - qa;
            return b.score - a.score;
        });
    }

    async function forceStart(hash, config = CONFIG) {
        const body =
            "hashes=" + encodeURIComponent(hash) +
            "&value=true";

        const response = await qbitPost(
            "/api/v2/torrents/setForceStart",
            body,
            config,
            10000,
            { "Content-Type": "application/x-www-form-urlencoded" }
        );

        if (response.status !== 200) {
            throw new Error("Force Start HTTP " + response.status);
        }
    }

    // ============================================================
    // RECHERCHE SUR LES TRACKERS — titre complet nettoyé, sans métadonnées entre crochets/parenthèses
    // ============================================================

    function normalizeHost(host) {
        return String(host || "").toLowerCase().replace(/^www\./, "");
    }

    function isCurrentProvider(provider) {
        try {
            return normalizeHost(new URL(provider.base).hostname) === normalizeHost(location.hostname);
        } catch (_) {
            return false;
        }
    }

    function isParentheticalSearchMetadata(innerText) {
        const value = String(innerText || "")
            .replace(/\s+/g, " ")
            .trim();

        if (!value) {
            return true;
        }

        // Size/numeric metadata: (188.25 MiB), (2.10 GiB), (123), etc.
        if (
            /\b\d+(?:[.,]\d+)?\s*(?:KiB|MiB|GiB|TiB|KB|MB|GB|TB)\b/i.test(value) ||
            /^[\d\s.,:+\-_/]+$/.test(value)
        ) {
            return true;
        }

        // Known tracker/site names or domain-looking metadata.
        const knownTracker =
            /\b(?:Kufirc|HappyFappy|Empornium|EmParadise|SexTorrent|BitPorn|ExoticaZ|TeenSexMania|TeenMegaWorld)\b/i;

        const domainLike =
            /\b[\w.-]+\.(?:com|net|org|to|eu|sx|rs|me|io|xxx|tv)\b/i;

        return knownTracker.test(value) || domainLike.test(value);
    }

    function buildTrackerSearchQuery(targetName) {
        let query = String(targetName || "");

        try {
            query = decodeURIComponent(query);
        } catch (_) {}

        // [] and {} are considered release/site metadata: remove block + content.
        query = query
            .replace(/\[[^\]]*\]/g, " ")
            .replace(/\{[^}]*\}/g, " ");

        // Parentheses are contextual:
        // - size / number / tracker-domain metadata => remove block + content
        // - meaningful subtitle => keep content, remove parentheses only
        //
        // [TeenSexMania com / TeenMegaWorld net] Dolce Vita
        // (Now She Owns Him) (188.25 MiB)
        // -> Dolce Vita Now She Owns Him
        query = query.replace(/\(([^()]*)\)/g, (_match, inner) => {
            return isParentheticalSearchMetadata(inner)
                ? " "
                : ` ${inner} `;
        });

        return query
            .replace(/\s+/g, " ")
            .trim();
    }

    function buildSearchVariants(targetName) {
        const fullQuery = buildTrackerSearchQuery(targetName);

        // Deliberately ONE query only.
        // PornScout must not silently shorten the title differently per tracker.
        return fullQuery.length >= 3 ? [fullQuery] : [];
    }

    function buildSearchUrls(provider, query) {
        const q = encodeURIComponent(query);

        switch (provider.searchStyle) {
            case "gazelle-title":
                // Kufirc / HappyFappy / Empornium / EmParadise
                // Advanced search, exact title field.
                return [
                    `${provider.base}/torrents.php?order_by=time&order_way=desc&searchtext=&action=advanced&title=${q}&sizeall=&sizetype=gb&sizerange=0.01&filelist=&taglist=&autocomplete_toggle=on`
                ];

            case "name":
                // SexTorrent / BitPorn
                return [
                    `${provider.base}/torrents?name=${q}`
                ];

            case "exoticaz":
                return [
                    `${provider.base}/torrents?in=1&search=${q}&sz=0&size=&uploader=`
                ];

            default:
                return [provider.base];
        }
    }

    function looksLikeLoginPage(html, finalUrl = "") {
        const text = String(html || "").toLowerCase();
        const url = String(finalUrl || "").toLowerCase();

        if (/login\.php|\/login(?:[/?#]|$)|\/signin(?:[/?#]|$)/i.test(url)) {
            return true;
        }

        if (
            /unauthorized\s*:\s*authorization error/i.test(text) ||
            /authorization error/i.test(text) ||
            /not authorized/i.test(text)
        ) {
            return true;
        }

        return (
            /name=["']?(?:username|password)["']?/i.test(text) &&
            /(login|log in|connexion|sign in)/i.test(text)
        );
    }

    async function trackerRequest(provider, url) {
        // Pour le tracker actuellement ouvert, utiliser fetch same-origin :
        // c'est la manière la plus fiable de réutiliser exactement la session courante.
        if (isCurrentProvider(provider)) {
            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
                redirect: "follow",
                cache: "no-store"
            });

            return {
                status: response.status,
                finalUrl: response.url || url,
                responseText: await response.text(),
                via: "same-origin"
            };
        }

        // Pour les autres trackers, GM_xmlhttpRequest permet le cross-origin.
        const response = await gmRequest({
            method: "GET",
            url,
            anonymous: false,
            withCredentials: true,
            timeout: 12000
        });

        return {
            status: response.status,
            finalUrl: response.finalUrl || url,
            responseText: response.responseText || "",
            via: "GM_xmlhttpRequest"
        };
    }

    function bestDetailAnchor(row, finalUrl, targetName = "") {
        const links = [...row.querySelectorAll("a[href]")];

        const headerLabels = /^(?:size|seed(?:er)?s?|leech(?:er)?s?|snatch(?:ed)?|uploaded|uploader|added|date|time|name|title|category|type|status|files?|comments?|rating|resolution|codec)$/i;

        const scored = links
            .map(anchor => {
                const href = anchor.getAttribute("href") || "";
                const label = String(anchor.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim();

                let score = 0;

                // Never treat table sorting/navigation links as torrent results.
                if (
                    /(?:[?&](?:order|sort|page|direction)=)/i.test(href) ||
                    headerLabels.test(label)
                ) {
                    return { anchor, href, text: label, score: -1000 };
                }

                // Never select download links as the release-detail link.
                if (/download|\.torrent(?:$|\?)/i.test(href)) {
                    return { anchor, href, text: label, score: -1000 };
                }

                // Strong known detail URL patterns.
                if (/torrentid=\d+/i.test(href)) score += 140;
                if (/torrents?\.php\?id=\d+/i.test(href)) score += 130;
                if (/\/torrents?\/\d+(?:[/?#]|$)/i.test(href)) score += 120;
                if (/\/torrent\/[^/?#]+/i.test(href)) score += 110;
                if (/(?:details?|view)(?:[/.?&#]|$)/i.test(href)) score += 80;

                // Prefer a link whose visible label resembles the requested title.
                if (label && targetName) {
                    score += Math.round(similarity(targetName, label) * 120);
                }

                if (isUsefulIdentity(label)) {
                    score += Math.min(30, label.length / 4);
                }

                return { anchor, href, text: label, score };
            })
            .filter(item => item.score > 15)
            .sort((a, b) => b.score - a.score);

        const best = scored[0];
        if (!best) return null;

        try {
            return {
                url: new URL(best.href, finalUrl).href,
                text: best.text
            };
        } catch (_) {
            return null;
        }
    }

    function parseGazelleSearchResults(html, finalUrl, targetName, currentResolution) {
        if (!html || looksLikeLoginPage(html, finalUrl)) {
            return {
                authRequired: true,
                results: [],
                parsedRows: 0
            };
        }

        const doc = new DOMParser().parseFromString(html, "text/html");

        const rows = [
            ...doc.querySelectorAll(
                "tr.group_torrent, tr.torrent, tr[class*='torrent'], table.torrent_table tr"
            )
        ];

        const uniqueRows = [...new Set(rows)];
        const found = [];
        const seen = new Set();

        for (const row of uniqueRows) {
            const context = String(row.innerText || row.textContent || "")
                .replace(/\s+/g, " ")
                .trim();

            if (!context || context.length < 4) {
                continue;
            }

            const details = bestDetailAnchor(row, finalUrl, targetName);
            if (!details) {
                continue;
            }

            const titleCandidate =
                isUsefulIdentity(details.text)
                    ? details.text
                    : context.slice(0, 280);

            const score = Math.max(
                similarity(targetName, titleCandidate),
                similarity(targetName, context)
            );

            // Parce que la requête est déjà ciblée, on peut accepter un seuil
            // plus souple que l'ancien Jaccard strict.
            if (score < 0.34) {
                continue;
            }

            const resolution =
                detectResolutionFromText(titleCandidate) ||
                detectResolutionFromText(context);

            const size =
                detectSizeFromText(context) ||
                detectSizeFromText(titleCandidate);

            const codec =
                detectCodecFromText(titleCandidate) ||
                detectCodecFromText(context);

            const source =
                detectSourceFromText(titleCandidate) ||
                detectSourceFromText(context);

            const seeders = detectSeedersFromElement(row);

            if (seen.has(details.url)) {
                continue;
            }

            seen.add(details.url);

            found.push({
                title: titleCandidate,
                context: context.slice(0, 360),
                url: details.url,
                resolution,
                size,
                codec,
                source,
                seeders,
                score
            });
        }

        return {
            authRequired: false,
            results: found
                .sort((a, b) => {
                    const qa = a.resolution?.value || 0;
                    const qb = b.resolution?.value || 0;

                    if (qa !== qb) return qb - qa;
                    return b.score - a.score;
                })
                .slice(0, 8),
            parsedRows: uniqueRows.length
        };
    }

    function parseGenericSearchResults(html, finalUrl, targetName, currentResolution) {
        if (!html || looksLikeLoginPage(html, finalUrl)) {
            return {
                authRequired: true,
                results: [],
                parsedRows: 0
            };
        }

        const doc = new DOMParser().parseFromString(html, "text/html");
        const containers = [
            ...doc.querySelectorAll(
                "tr, li, article, .torrent, .torrent-row, .panel, .card, [class*='torrent']"
            )
        ];

        const found = [];
        const seen = new Set();

        for (const container of containers) {
            const context = String(container.innerText || container.textContent || "")
                .replace(/\s+/g, " ")
                .trim();

            if (!context) continue;

            const score = similarity(targetName, context);
            if (score < 0.38) continue;

            // The release title is more trustworthy than the whole result container.
            // This avoids picking an unrelated 4K/8K token from another element in a broad row/card.
            const details = bestDetailAnchor(container, finalUrl, targetName);
            if (!details || seen.has(details.url)) continue;

            const titleCandidate =
                isUsefulIdentity(details.text)
                    ? details.text
                    : context.slice(0, 280);

            const resolution =
                detectResolutionFromText(titleCandidate) ||
                detectResolutionFromText(context);

            const size =
                detectSizeFromText(context) ||
                detectSizeFromText(titleCandidate);

            const codec =
                detectCodecFromText(titleCandidate) ||
                detectCodecFromText(context);

            const source =
                detectSourceFromText(titleCandidate) ||
                detectSourceFromText(context);

            const seeders = detectSeedersFromElement(container);

            seen.add(details.url);

            found.push({
                title: titleCandidate,
                context: context.slice(0, 360),
                url: details.url,
                resolution,
                size,
                codec,
                source,
                seeders,
                score
            });
        }

        return {
            authRequired: false,
            results: found
                .sort((a, b) => {
                    const qa = a.resolution?.value || 0;
                    const qb = b.resolution?.value || 0;
                    if (qa !== qb) return qb - qa;
                    return b.score - a.score;
                })
                .slice(0, 8),
            parsedRows: containers.length
        };
    }

    function parseSearchResults(provider, html, finalUrl, targetName, currentResolution) {
        if (provider.engine === "gazelle") {
            return parseGazelleSearchResults(
                html,
                finalUrl,
                targetName,
                currentResolution
            );
        }

        return parseGenericSearchResults(
            html,
            finalUrl,
            targetName,
            currentResolution
        );
    }

    async function searchProvider(provider, targetName, currentResolution) {
        const variants = buildSearchVariants(targetName);

        if (!variants.length) {
            return {
                provider,
                results: [],
                searchUrl: provider.base,
                status: "no-query",
                query: "",
                httpStatus: null,
                parsedRows: 0,
                engine: provider.engine
            };
        }

        let last = {
            status: "no-result",
            query: variants[0],
            searchUrl: buildSearchUrls(provider, variants[0])[0],
            httpStatus: null,
            parsedRows: 0,
            via: ""
        };

        for (const query of variants) {
            const urls = buildSearchUrls(provider, query);

            for (const url of urls) {
                try {
                    const response = await trackerRequest(provider, url);

                    last = {
                        status: "no-result",
                        query,
                        searchUrl: url,
                        httpStatus: response.status,
                        parsedRows: 0,
                        via: response.via
                    };

                    if (response.status < 200 || response.status >= 400) {
                        last.status = "http-" + response.status;
                        continue;
                    }

                    const parsed = parseSearchResults(
                        provider,
                        response.responseText,
                        response.finalUrl || url,
                        targetName,
                        currentResolution
                    );

                    last.parsedRows = parsed.parsedRows || 0;

                    if (parsed.authRequired) {
                        last.status = "auth";
                        continue;
                    }

                    if (parsed.results.length) {
                        const enrichedResults = await enrichTrackerResults(
                            provider,
                            parsed.results
                        );

                        return {
                            provider,
                            results: enrichedResults,
                            searchUrl: url,
                            status: "ok",
                            query,
                            httpStatus: response.status,
                            parsedRows: parsed.parsedRows || 0,
                            via: response.via,
                            engine: provider.engine
                        };
                    }
                } catch (error) {
                    log("Recherche tracker impossible", provider.label, error);
                    last.status = "error";
                    last.error = error.message;
                }
            }
        }

        return {
            provider,
            results: [],
            engine: provider.engine,
            ...last
        };
    }

    async function searchBetterReleases(targetName, currentResolution) {
        if (!CONFIG.searchBetterOnTrackers) {
            return [];
        }

        if (!targetName || !isUsefulIdentity(targetName)) {
            log("Recherche trackers annulée : identité cible invalide", targetName);
            return getEnabledProviders().map(provider => ({
                provider,
                results: [],
                searchUrl: provider.base,
                status: "invalid-target",
                query: "",
                httpStatus: null,
                parsedRows: 0,
                engine: provider.engine
            }));
        }

        notify("Recherche d'une meilleure résolution sur les trackers…", "info", 9000);

        const providers = getEnabledProviders();

        if (!providers.length) {
            return [];
        }

        const settled = await Promise.allSettled(
            providers.map(provider =>
                searchProvider(provider, targetName, currentResolution)
            )
        );

        return settled
            .filter(item => item.status === "fulfilled")
            .map(item => item.value);
    }

    // ============================================================
    // MODALE D'AVERTISSEMENT / CHOIX
    // ============================================================

    function renderExisting(existing) {
        if (!existing.length) {
            return `<div class="qbd-muted">Aucun contenu suffisamment similaire détecté dans les clients BitTorrent.</div>`;
        }

        return existing.slice(0, 8).map(item => {
            const res = item.resolution
                ? formatResolution(item.resolution)
                : "résolution inconnue";

            const profile = item.clientProfile;

            return `
                <div class="qbd-card">
                    <div class="qbd-release-meta">
                        <span class="qbd-pill ${item.resolution?.value >= 1080 ? "qbd-pill-good" : "qbd-pill-warn"}">
                            ${escapeHtml(res)}
                        </span>
                        ${profile ? `
                            <span class="qbd-pill">
                                <img src="${escapeHtml(clientIconUrl(profile))}"
                                     alt=""
                                     style="width:1em;height:1em;vertical-align:-.16em;margin-right:3px">
                                ${escapeHtml(getClientDisplayName(profile))}
                            </span>
                        ` : ""}
                    </div>
                    <strong>${escapeHtml(item.name)}</strong>
                </div>
            `;
        }).join("");
    }

    const TRACKER_FAVICON_CACHE = new Map();
    const TRACKER_FAVICON_STORAGE_PREFIX = "pornscout-tracker-favicon-v1:";

    function trackerFaviconStorageKey(provider) {
        return TRACKER_FAVICON_STORAGE_PREFIX + provider.id;
    }

    function trackerFaviconCandidates(provider) {
        const candidates = [];

        try { candidates.push(new URL("/favicon.ico", provider.base).href); } catch (_) {}
        try { candidates.push(new URL("/favicon.png", provider.base).href); } catch (_) {}
        try { candidates.push(new URL("/apple-touch-icon.png", provider.base).href); } catch (_) {}

        return [...new Set(candidates)];
    }

    function detectImageMime(response, url) {
        const headers = String(response.responseHeaders || "");
        const contentType =
            headers.match(/^content-type\s*:\s*([^;\r\n]+)/im)?.[1]?.trim().toLowerCase() || "";

        if (contentType.startsWith("image/")) {
            return contentType === "image/vnd.microsoft.icon"
                ? "image/x-icon"
                : contentType;
        }

        const lower = String(url || "").toLowerCase();

        if (lower.includes(".svg")) return "image/svg+xml";
        if (lower.includes(".png")) return "image/png";
        if (lower.includes(".webp")) return "image/webp";
        if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
        if (lower.includes(".ico")) return "image/x-icon";

        const bytes = new Uint8Array(response.response || new ArrayBuffer(0));

        if (
            bytes.length >= 8 &&
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47
        ) {
            return "image/png";
        }

        if (
            bytes.length >= 4 &&
            bytes[0] === 0x00 &&
            bytes[1] === 0x00 &&
            bytes[2] === 0x01 &&
            bytes[3] === 0x00
        ) {
            return "image/x-icon";
        }

        if (
            bytes.length >= 3 &&
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff
        ) {
            return "image/jpeg";
        }

        const prefix = new TextDecoder()
            .decode(bytes.slice(0, Math.min(bytes.length, 300)))
            .trim()
            .toLowerCase();

        if (prefix.startsWith("<svg") || prefix.includes("<svg")) {
            return "image/svg+xml";
        }

        return "";
    }

    async function fetchTrackerIconAsDataUri(url) {
        const response = await gmRequest({
            method: "GET",
            url,
            responseType: "arraybuffer",
            anonymous: false,
            withCredentials: true,
            timeout: 15000
        });

        if (response.status < 200 || response.status >= 400) {
            throw new Error(`favicon HTTP ${response.status}`);
        }

        const buffer = response.response;

        if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 16) {
            throw new Error("favicon vide ou invalide");
        }

        const mime = detectImageMime(response, url);

        if (!mime) {
            throw new Error("favicon reçu mais format image non détecté");
        }

        return `data:${mime};base64,${arrayBufferToBase64(buffer)}`;
    }

    async function discoverTrackerFaviconUrl(provider) {
        try {
            const response = await trackerRequest(
                provider,
                provider.faviconPage || provider.base
            );

            if (
                response.status < 200 ||
                response.status >= 400 ||
                !response.responseText
            ) {
                return null;
            }

            const doc = new DOMParser().parseFromString(
                response.responseText,
                "text/html"
            );

            const iconLinks = [
                ...doc.querySelectorAll(
                    'link[rel~="icon"][href], link[rel="shortcut icon"][href], link[rel="apple-touch-icon"][href]'
                )
            ];

            // Prefer the largest declared icon when sizes are available.
            iconLinks.sort((a, b) => {
                const sizeValue = element => {
                    const sizes = element.getAttribute("sizes") || "";
                    const values = [...sizes.matchAll(/(\d+)x(\d+)/gi)]
                        .map(match => Number(match[1]) * Number(match[2]));
                    return values.length ? Math.max(...values) : 0;
                };

                return sizeValue(b) - sizeValue(a);
            });

            for (const iconLink of iconLinks) {
                try {
                    return new URL(
                        iconLink.getAttribute("href"),
                        response.finalUrl || provider.faviconPage || provider.base
                    ).href;
                } catch (_) {}
            }
        } catch (error) {
            log("Découverte favicon impossible", provider.label, error);
        }

        return null;
    }

    async function loadTrackerFaviconDataUri(provider, { forceRefresh = false } = {}) {
        if (!forceRefresh && TRACKER_FAVICON_CACHE.has(provider.id)) {
            return TRACKER_FAVICON_CACHE.get(provider.id);
        }

        const storageKey = trackerFaviconStorageKey(provider);

        if (!forceRefresh) {
            const stored = GM_getValue(storageKey, "");

            if (typeof stored === "string" && stored.startsWith("data:image/")) {
                TRACKER_FAVICON_CACHE.set(provider.id, stored);
                return stored;
            }
        }

        const discovered = await discoverTrackerFaviconUrl(provider);
        const candidates = [
            discovered,
            ...trackerFaviconCandidates(provider)
        ].filter(Boolean);

        for (const url of [...new Set(candidates)]) {
            try {
                const dataUri = await fetchTrackerIconAsDataUri(url);

                TRACKER_FAVICON_CACHE.set(provider.id, dataUri);
                GM_setValue(storageKey, dataUri);

                log("Favicon tracker intégré en data URI", provider.label, url);
                return dataUri;
            } catch (error) {
                log("Favicon tracker refusé", provider.label, url, error);
            }
        }

        return "";
    }

    function bindTrackerIcons(root) {
        root.querySelectorAll(".qbd-tracker-icon").forEach(img => {
            const provider = PROVIDERS.find(
                item => item.id === img.dataset.providerId
            );
            const fallback = img.nextElementSibling;

            if (!provider) return;

            // Never depend on a direct remote <img>. Show fallback until the
            // GM request has downloaded the real icon and converted it locally.
            img.style.display = "none";

            if (fallback) {
                fallback.style.display = "inline-flex";
            }

            loadTrackerFaviconDataUri(provider).then(dataUri => {
                if (!dataUri) return;

                img.onload = () => {
                    img.style.display = "block";

                    if (fallback) {
                        fallback.style.display = "none";
                    }
                };

                img.onerror = () => {
                    img.style.display = "none";

                    if (fallback) {
                        fallback.style.display = "inline-flex";
                    }

                    // Corrupt/obsolete cache: delete it for the next opening.
                    GM_deleteValue(trackerFaviconStorageKey(provider));
                    TRACKER_FAVICON_CACHE.delete(provider.id);
                };

                img.src = dataUri;
            });
        });
    }


    function bindTrackerResultActions(root, onSent = null, onCurrent = null) {
        root.querySelectorAll("[data-pornscout-send-result]").forEach(button => {
            button.addEventListener("click", async () => {
                const providerId = button.dataset.providerId;
                const resultUrl = button.dataset.resultUrl;
                const clientId = button.dataset.clientId;

                const provider = PROVIDERS.find(item => item.id === providerId);
                const profile = getClientById(clientId);

                if (!provider || !resultUrl || !profile) {
                    notify("Résultat tracker ou client invalide", "error");
                    return;
                }

                button.disabled = true;

                try {
                    await sendTrackerResultToClient(
                        provider,
                        resultUrl,
                        profile
                    );

                    if (typeof onSent === "function") {
                        onSent({
                            provider,
                            resultUrl,
                            profile
                        });
                    }
                } catch (error) {
                    console.error("[PornScout]", error);
                    notify("✕ " + error.message, "error", 6500);
                    button.disabled = false;
                }
            });
        });

        root.querySelectorAll("[data-pornscout-send-current]").forEach(button => {
            button.addEventListener("click", () => {
                const profile = getClientById(button.dataset.clientId);

                if (!profile) {
                    notify("Client BitTorrent invalide", "error");
                    return;
                }

                if (typeof onCurrent === "function") {
                    onCurrent(profile);
                }
            });
        });
    }


    function normalizeCodecPreference(value) {
        const text = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

        if (["av1", "aomedia"].includes(text)) return "av1";
        if (["hevc", "h265", "x265"].includes(text)) return "hevc";
        if (["avc", "h264", "x264"].includes(text)) return "avc";
        if (["vp9"].includes(text)) return "vp9";
        if (["mpeg4visual", "mpeg4", "xvid", "divx"].includes(text)) return "mpeg4";
        if (["mpeg2"].includes(text)) return "mpeg2";
        return text;
    }

    function normalizeSourcePreference(value) {
        const text = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

        if (text.includes("remux")) return "remux";
        if (["webdl", "webdownload"].includes(text)) return "webdl";
        if (["webrip"].includes(text)) return "webrip";
        if (["bluray", "blurayrip", "bdrip", "brrip", "bd"].includes(text)) return "bluray";
        if (["hdtv"].includes(text)) return "hdtv";
        if (["dvd", "dvdrip"].includes(text)) return "dvd";
        if (["encode", "reencode"].includes(text)) return "encode";
        return text;
    }

    function preferenceRank(value, configured, normalizer) {
        if (!value) return -1;

        const prefs = parseCommaList(configured).map(normalizer);
        if (!prefs.length) return -1;

        const normalized = normalizer(value);
        const index = prefs.indexOf(normalized);

        return index === -1
            ? 0
            : prefs.length - index + 1;
    }

    function releasePassesUpgradeFilters(release, config = CONFIG) {
        if (config.upgradeUseMaxSize) {
            const gib = sizeToGiB(release.size);

            // If a hard size limit is enabled and size is unknown,
            // do not automatically call the release "better".
            if (gib == null || gib > Number(config.upgradeMaxSizeGiB || 0)) {
                return false;
            }
        }

        if (config.upgradeUseMinSeeders) {
            if (
                !Number.isFinite(release.seeders) ||
                release.seeders < Number(config.upgradeMinSeeders || 0)
            ) {
                return false;
            }
        }

        return true;
    }

    function compareReleasePreference(candidate, current, config = CONFIG) {
        if (!releasePassesUpgradeFilters(candidate, config)) {
            return -1;
        }

        const candidateRes = Number(candidate.resolution?.value || 0);
        const currentRes = Number(current?.resolution?.value || 0);

        if (candidateRes !== currentRes) {
            return candidateRes > currentRes ? 1 : -1;
        }

        const candidateCodec = preferenceRank(
            candidate.codec,
            config.upgradePreferredCodecs,
            normalizeCodecPreference
        );
        const currentCodec = preferenceRank(
            current?.codec,
            config.upgradePreferredCodecs,
            normalizeCodecPreference
        );

        if (candidateCodec !== currentCodec) {
            return candidateCodec > currentCodec ? 1 : -1;
        }

        const candidateSource = preferenceRank(
            candidate.source,
            config.upgradePreferredSources,
            normalizeSourcePreference
        );
        const currentSource = preferenceRank(
            current?.source,
            config.upgradePreferredSources,
            normalizeSourcePreference
        );

        if (candidateSource !== currentSource) {
            return candidateSource > currentSource ? 1 : -1;
        }

        if (
            Number.isFinite(candidate.seeders) &&
            Number.isFinite(current?.seeders) &&
            candidate.seeders !== current.seeders
        ) {
            return candidate.seeders > current.seeders ? 1 : -1;
        }

        return 0;
    }

    function upgradeSortScore(result, config = CONFIG) {
        const resolution = Number(result.resolution?.value || 0);
        const codec = preferenceRank(
            result.codec,
            config.upgradePreferredCodecs,
            normalizeCodecPreference
        );
        const source = preferenceRank(
            result.source,
            config.upgradePreferredSources,
            normalizeSourcePreference
        );
        const seeders = Number.isFinite(result.seeders) ? Math.min(result.seeders, 10000) : -1;
        const size = sizeToGiB(result.size);

        return {
            resolution,
            codec,
            source,
            seeders,
            size: size == null ? Number.POSITIVE_INFINITY : size
        };
    }

    function sortUpgradeResults(a, b) {
        const A = upgradeSortScore(a.result);
        const B = upgradeSortScore(b.result);

        if (A.resolution !== B.resolution) return B.resolution - A.resolution;
        if (A.codec !== B.codec) return B.codec - A.codec;
        if (A.source !== B.source) return B.source - A.source;
        if (A.seeders !== B.seeders) return B.seeders - A.seeders;
        if (A.size !== B.size) return A.size - B.size;

        return (b.result.score || 0) - (a.result.score || 0);
    }


    function findBetterTrackerResults(searches, currentRelease) {
        if (!Array.isArray(searches)) {
            return [];
        }

        return searches
            .flatMap(search =>
                (search.results || [])
                    .filter(result =>
                        compareReleasePreference(result, currentRelease) > 0
                    )
                    .map(result => ({
                        provider: search.provider,
                        result
                    }))
            )
            .sort(sortUpgradeResults);
    }


    function renderSearchResults(searches) {
        if (!searches || !searches.length) {
            return `<div class="qbd-muted">Recherche automatique désactivée ou non exécutée.</div>`;
        }

        return searches.map(search => {
            const results = search.results || [];
            const query = search.query || "";

            const diagnostic = CONFIG.debug
                ? [
                    search.engine ? `moteur: ${search.engine}` : "",
                    query ? `requête: “${escapeHtml(query)}”` : "",
                    search.httpStatus ? `HTTP ${search.httpStatus}` : "",
                    Number.isFinite(search.parsedRows) ? `${search.parsedRows} ligne(s) analysée(s)` : ""
                ].filter(Boolean).join(" · ")
                : "";

            const trackerUrl = search.searchUrl || search.provider.base;
            const fallbackLetter = String(search.provider.label || "?").slice(0, 1).toUpperCase();

            const trackerTitle = `
                <a class="qbd-tracker-title"
                   target="_blank"
                   rel="noopener noreferrer"
                   href="${escapeHtml(trackerUrl)}"
                   title="${escapeHtml(t("goToSearch"))}">
                    <span class="qbd-tracker-icon-wrap">
                        <img class="qbd-tracker-icon"
                             data-provider-id="${escapeHtml(search.provider.id)}"
                             alt="${escapeHtml(search.provider.label)}">
                        <span class="qbd-tracker-icon-fallback"
                              style="display:inline-flex">${escapeHtml(fallbackLetter)}</span>
                    </span>
                    ${escapeHtml(search.provider.label)}
                </a>
            `;

            if (!results.length) {
                let statusLabel = "aucun résultat compatible détecté";

                if (search.status === "auth") {
                    statusLabel = "session non détectée / login requis";
                } else if (search.status === "invalid-target") {
                    statusLabel = "titre du contenu non détecté : recherche impossible";
                } else if (search.status === "error") {
                    statusLabel = "erreur pendant la recherche";
                } else if (String(search.status).startsWith("http-")) {
                    statusLabel = "le tracker a refusé ou échoué la requête";
                }

                return `
                    <div class="qbd-card">
                        ${trackerTitle}
                        <div class="qbd-muted" style="margin-top:6px">${escapeHtml(statusLabel)}</div>
                        ${diagnostic ? `<div class="qbd-muted" style="margin-top:3px">${diagnostic}</div>` : ""}
                    </div>
                `;
            }

            return `
                <div class="qbd-card">
                    ${trackerTitle}
                    ${diagnostic ? `<div class="qbd-muted" style="margin-top:4px">${diagnostic}</div>` : ""}

                    ${results.map(result => `
                        <div style="margin-top:12px">
                            <div class="qbd-release-meta">
                                <span class="qbd-pill ${result.resolution ? "qbd-pill-good" : ""}">
                                    ${escapeHtml(result.resolution ? formatResolution(result.resolution) : "qualité inconnue")}
                                </span>
                                ${result.size ? `
                                    <span class="qbd-pill">${escapeHtml(result.size.text)}</span>
                                ` : ""}

                                ${renderClientTargetButtons({
                                    action: "result",
                                    providerId: search.provider.id,
                                    resultUrl: result.url
                                })}

                                ${result.codec ? `
                                    <span class="qbd-pill">${escapeHtml(result.codec)}</span>
                                ` : ""}
                                ${result.source ? `
                                    <span class="qbd-pill">${escapeHtml(result.source)}</span>
                                ` : ""}
                                ${Number.isFinite(result.seeders) ? `
                                    <span class="qbd-pill">${escapeHtml(t("seedersLabel", { count: result.seeders }))}</span>
                                ` : ""}
                                ${result.upgradeEligible === false ? `
                                    <span class="qbd-pill qbd-pill-warn">${escapeHtml(t("excludedByPrefs"))}</span>
                                ` : ""}
                            </div>

                            <a class="qbd-link"
                               target="_blank"
                               rel="noopener noreferrer"
                               href="${escapeHtml(result.url)}">${escapeHtml(result.title || result.url)}</a>
                        </div>
                    `).join("")}
                </div>
            `;
        }).join("");
    }

    function openQualitySearchPanel({
        targetName,
        resolution,
        existing,
        searches,
        qualityGateTriggered = false,
        existingNotWorse = false,
        betterTrackerResults = []
    }) {
        return new Promise(resolve => {
            const hasBetterTrackerRelease =
                Array.isArray(betterTrackerResults) &&
                betterTrackerResults.length > 0;

            const needsQualityDecision =
                CONFIG.warnBelowMinimum &&
                qualityGateTriggered;

            const needsDecision =
                needsQualityDecision ||
                hasBetterTrackerRelease ||
                existingNotWorse;

            const overlay = createOverlay(`
                <h2>🔎 Recherche de meilleure qualité</h2>

                <div class="qbd-card">
                    <div class="qbd-muted">Contenu détecté</div>
                    <strong>${escapeHtml(targetName || "(nom non détecté)")}</strong>

                    <div class="qbd-current-meta" style="margin-top:6px">
                        <span class="qbd-pill ${resolution?.value >= CONFIG.minimumResolution ? "qbd-pill-good" : (resolution ? "qbd-pill-warn" : "")}">
                            Actuel : ${escapeHtml(formatResolution(resolution))}
                        </span>
                        <span class="qbd-pill">
                            minimum : ${escapeHtml(CONFIG.minimumResolution + "p")}
                        </span>

                        ${renderClientTargetButtons({
                            action: "current"
                        })}
                    </div>
                </div>

                ${hasBetterTrackerRelease ? `
                    <div class="qbd-status">
                        ⚠️ ${escapeHtml(t("betterFound"))}
                    </div>
                ` : ""}

                ${needsQualityDecision && !hasBetterTrackerRelease ? `
                    <div class="qbd-status">
                        ⚠️ Ce torrent ne sera pas envoyé automatiquement :
                        ${resolution
                            ? "sa qualité est inférieure au minimum configuré."
                            : "sa résolution n'a pas pu être déterminée."}
                    </div>
                ` : ""}

                <h3>Clients BitTorrent</h3>
                ${renderExisting(existing)}

                <h3>Trackers</h3>
                ${renderSearchResults(searches)}

                <div class="qbd-actions">
                    <button class="qbd-btn ${needsDecision ? "" : "qbd-btn-primary"}"
                            id="qbd-panel-close">
                        ${needsDecision ? escapeHtml(t("cancel")) : "Fermer"}
                    </button>
                </div>
            `);

            overlay.querySelector(".qbd-modal")?.classList.add("qbd-quality-modal");

            bindTrackerIcons(overlay);

            bindTrackerResultActions(
                overlay,
                () => {
                    overlay.remove();
                    resolve({
                        action: "alternative-sent"
                    });
                },
                profile => {
                    overlay.remove();
                    resolve({
                        action: "send-current",
                        clientId: profile.id
                    });
                }
            );

            overlay.querySelector("#qbd-panel-close").addEventListener("click", () => {
                overlay.remove();
                resolve({
                    action: needsDecision ? "cancel" : "close"
                });
            });
        });
    }


    function askBeforeDownload({
        targetName,
        resolution,
        existing,
        searches,
        belowMinimum,
        unknownResolution
    }) {
        return new Promise(resolve => {
            const betterExisting = existing.filter(item => {
                if (!item.resolution) return false;
                if (!resolution) return true;
                return item.resolution.value > resolution.value;
            });

            const overlay = createOverlay(`
                <h2>${
                    unknownResolution
                        ? "⚠️ Qualité non détectée"
                        : (belowMinimum ? "⚠️ Qualité inférieure au seuil" : "⚠️ Contenu similaire détecté")
                }</h2>

                <div class="qbd-card">
                    <div class="qbd-muted">Torrent sélectionné</div>
                    <strong>${escapeHtml(targetName || "(nom non détecté)")}</strong>
                    <div style="margin-top:6px">
                        <span class="qbd-pill ${belowMinimum ? "qbd-pill-bad" : "qbd-pill-good"}">
                            ${escapeHtml(formatResolution(resolution))}
                        </span>
                        <span class="qbd-pill">minimum : ${escapeHtml(CONFIG.minimumResolution + "p")}</span>
                    </div>
                </div>

                ${!resolution ? `
                    <div class="qbd-status">
                        ℹ️ Aucune résolution fiable n'a été trouvée dans le titre, la page ou les noms de fichiers du torrent.
                        Le script ne suppose donc aucune qualité.
                    </div>
                ` : ""}

                ${betterExisting.length ? `
                    <div class="qbd-status">
                        ⚠️ Une version de résolution supérieure semble déjà être présente dans qBitTorrent.
                    </div>
                ` : ""}

                <h3>Dans qBitTorrent</h3>
                ${renderExisting(existing)}

                ${belowMinimum && CONFIG.searchBetterOnTrackers ? `
                    <h3>Recherche d'une meilleure version</h3>
                    ${renderSearchResults(searches)}
                ` : ""}

                <div class="qbd-actions">
                    <button class="qbd-btn" id="qbd-choice-cancel">Annuler</button>
                    <button class="qbd-btn qbd-btn-warn" id="qbd-choice-anyway">Envoyer quand même à qBitTorrent</button>
                </div>
            `);

            bindTrackerIcons(overlay);
            bindTrackerResultActions(overlay);

            overlay.querySelector(".qbd-modal")?.classList.add("qbd-quality-modal");
            overlay.querySelector("#qbd-choice-cancel").addEventListener("click", () => {
                overlay.remove();
                resolve(false);
            });

            overlay.querySelector("#qbd-choice-anyway").addEventListener("click", () => {
                overlay.remove();
                resolve(true);
            });
        });
    }

    // ============================================================
    // ENVOI DIRECT D'UN RÉSULTAT TRACKER
    // ============================================================

    function findTorrentDownloadUrl(html, finalUrl) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const links = [...doc.querySelectorAll("a[href]")];

        const scored = links
            .map(anchor => {
                const href = anchor.getAttribute("href") || "";
                const label = String(anchor.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim();

                let score = 0;

                if (/magnet:/i.test(href)) {
                    return { href, score: -1000 };
                }

                if (/\.torrent(?:$|[?#])/i.test(href)) score += 180;
                if (/[?&]action=download(?:[&#]|$)/i.test(href)) score += 170;
                if (/\/download(?:\/|[?#]|$)/i.test(href)) score += 150;
                if (/download\.php/i.test(href)) score += 140;
                if (/torrent[_/-]?download/i.test(href)) score += 130;
                if (/\bdownload\b/i.test(label)) score += 80;
                if (/\btorrent\b/i.test(label)) score += 35;

                return { href, score };
            })
            .filter(item => item.score > 70)
            .sort((a, b) => b.score - a.score);

        const best = scored[0];

        if (!best) {
            return null;
        }

        try {
            return new URL(best.href, finalUrl).href;
        } catch (_) {
            return null;
        }
    }

    async function sendFetchedTorrentToClient(downloadUrl, context = {}, profile) {
        if (!profile) {
            throw new Error("Aucun client BitTorrent cible");
        }

        const runtime = clientRuntimeConfig(profile);

        await testClient(runtime);

        const torrent = await fetchTorrent(downloadUrl);
        const hashes = await calculateHashes(torrent.buffer);
        const torrentMetadata = parseInfoMetadata(hashes.info);

        const enrichedContext = {
            ...context,
            resolution:
                context.resolution ||
                detectTargetResolution(torrentMetadata, torrent.filename),
            codec:
                context.codec ||
                detectCodecFromText(torrentMetadata.name) ||
                detectCodecFromText(torrentMetadata.files.join(" ")),
            source:
                context.source ||
                detectSourceFromText(torrentMetadata.name) ||
                detectSourceFromText(torrentMetadata.files.join(" "))
        };

        const exact = await findExactInSelectedClient(
            hashes,
            runtime
        );

        if (exact) {
            notify(
                `Torrent déjà présent dans ${getClientDisplayName(profile)}`,
                "warning"
            );

            return {
                duplicate: true,
                hash: exact.hash
            };
        }

        const added = await addBufferToSelectedClient(
            torrent.buffer,
            torrent.filename,
            hashes,
            runtime,
            enrichedContext
        );

        if (added.conflictWithoutMatch) {
            throw new Error(
                `${getClientDisplayName(profile)} : conflit lors de l'ajout`
            );
        }

        if (added.duplicate) {
            notify(
                `Torrent déjà présent dans ${getClientDisplayName(profile)}`,
                "warning"
            );
            return added;
        }

        notify(
            `✓ Envoyé vers ${getClientDisplayName(profile)}`,
            "success"
        );

        return added;
    }

    async function sendTrackerResultToClient(provider, detailUrl, profile) {
        notify("Récupération de la fiche torrent…", "info", 8000);

        const detail = await trackerRequest(provider, detailUrl);

        if (detail.status < 200 || detail.status >= 400) {
            throw new Error(`${provider.label} HTTP ${detail.status}`);
        }

        if (looksLikeLoginPage(detail.responseText, detail.finalUrl || detailUrl)) {
            throw new Error(`${provider.label} : session non détectée / login requis`);
        }

        const detailMetadata = extractTrackerDetailMetadata(
            detail.responseText,
            detail.finalUrl || detailUrl,
            ""
        );

        const downloadUrl = findTorrentDownloadUrl(
            detail.responseText,
            detail.finalUrl || detailUrl
        );

        if (!downloadUrl) {
            throw new Error(
                `${provider.label} : lien .torrent introuvable sur la fiche`
            );
        }

        notify(
            `Envoi vers ${getClientDisplayName(profile)}…`,
            "info",
            8000
        );

        await sendFetchedTorrentToClient(downloadUrl, {
            tracker: provider.label,
            resolution: detailMetadata.resolution,
            codec: detailMetadata.codec,
            source: detailMetadata.source,
            seeders: detailMetadata.seeders,
            size: detailMetadata.size
        }, profile);
    }

    // ============================================================
    // AJOUT QBITTORRENT
    // ============================================================

    async function uploadTorrent(buffer, filename, config = CONFIG, context = {}) {
        const blob = new Blob([buffer], { type: "application/x-bittorrent" });

        await ensureQbitOrganization(config, context);

        const form = new FormData();
        form.append("torrents", blob, filename);

        const category = String(config.qbitCategory || "").trim();
        if (category) {
            form.append("category", category);
        }

        const tags = combinedOrganizationLabels(
            parseCommaList(config.qbitTags),
            context,
            config
        );
        if (tags.length) {
            form.append("tags", tags.join(","));
        }

        const response = await qbitPost(
            "/api/v2/torrents/add",
            form,
            config,
            30000
        );

        if (response.status === 409) {
            return { conflict: true };
        }

        if (response.status !== 200) {
            throw new Error(
                "Ajout qBitTorrent HTTP " +
                response.status +
                (response.responseText ? " — " + response.responseText.trim().slice(0, 220) : "")
            );
        }

        return { conflict: false };
    }

    async function waitForTorrent(hashes, config = CONFIG) {
        for (let attempt = 1; attempt <= 15; attempt++) {
            const found = await findQbitHash(hashes, config);

            if (found) {
                return found;
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        return null;
    }

    // ============================================================
    // TRAITEMENT COMPLET
    // ============================================================

    async function sendToClient(url, pageContext = null) {
        try {
            if (!hasAnyClientConfig()) {
                const saved = await openConfigModal({ firstRun: true });

                if (!saved || !hasAnyClientConfig()) {
                    return;
                }
            }

            notify("Analyse du torrent…", "info", 7000);

            const torrent = await fetchTorrent(url);
            const hashes = await calculateHashes(torrent.buffer);

            const metadata = parseInfoMetadata(hashes.info);

            const targetName = deriveTargetIdentity(
                metadata,
                torrent.filename,
                pageContext
            );

            const resolution = detectTargetResolution(
                metadata,
                torrent.filename
            );

            const currentRelease = detectCurrentPageReleaseMetadata(
                metadata,
                torrent.filename,
                resolution
            );

            log("Contexte page", pageContext);
            log("Identité cible", targetName);
            log("Résolution", resolution);
            log("Fichiers torrent", metadata.files);

            let existing = [];

            if (CONFIG.checkSimilarInQbit) {
                notify(
                    "Vérification des autres qualités dans les clients BitTorrent…",
                    "info",
                    7000
                );

                existing = await findSimilarAcrossClients(
                    targetName,
                    resolution
                );
            }

            const unknownResolution = !resolution;

            const belowMinimum =
                Boolean(resolution) &&
                Number(resolution.value) < Number(CONFIG.minimumResolution);

            const qualityGateTriggered =
                unknownResolution ||
                belowMinimum;

            const existingNotWorse = existing.some(item => {
                if (!item.resolution || !resolution) return false;
                return item.resolution.value >= resolution.value;
            });

            let searches = [];

            const shouldSearchTrackers =
                CONFIG.searchBetterOnTrackers &&
                getEnabledProviders().length > 0;

            if (shouldSearchTrackers) {
                searches = await searchBetterReleases(
                    targetName,
                    resolution
                );
            }

            for (const search of searches) {
                for (const result of search.results || []) {
                    result.upgradeEligible =
                        releasePassesUpgradeFilters(result);
                }
            }

            const betterTrackerResults =
                findBetterTrackerResults(
                    searches,
                    currentRelease
                );

            let chosenProfile = null;
            let decisionHandledByPanel = false;

            const mustOpenSelection =
                CONFIG.showQualitySearchPanel ||
                betterTrackerResults.length > 0 ||
                existingNotWorse ||
                (
                    CONFIG.warnBelowMinimum &&
                    qualityGateTriggered
                );

            if (mustOpenSelection) {
                const panelDecision = await openQualitySearchPanel({
                    targetName,
                    resolution,
                    existing,
                    searches,
                    qualityGateTriggered,
                    existingNotWorse,
                    betterTrackerResults
                });

                if (panelDecision?.action === "alternative-sent") {
                    return;
                }

                if (panelDecision?.action === "cancel") {
                    notify("Téléchargement annulé", "warning");
                    return;
                }

                if (panelDecision?.action === "send-current") {
                    chosenProfile = getClientById(
                        panelDecision.clientId
                    );

                    if (!chosenProfile) {
                        throw new Error(
                            "Client BitTorrent cible introuvable"
                        );
                    }

                    decisionHandledByPanel = true;
                } else if (
                    betterTrackerResults.length > 0 ||
                    existingNotWorse ||
                    (
                        CONFIG.warnBelowMinimum &&
                        qualityGateTriggered
                    )
                ) {
                    // A decision was required: closing/cancelling without
                    // choosing a client must never send the current torrent.
                    return;
                }
            }

            if (
                qualityGateTriggered &&
                CONFIG.warnBelowMinimum &&
                !decisionHandledByPanel
            ) {
                // The selection panel should normally have handled this.
                return;
            }

            chosenProfile =
                chosenProfile ||
                getDefaultClientProfile();

            if (!chosenProfile) {
                throw new Error(
                    "Aucun client BitTorrent par défaut configuré"
                );
            }

            const runtime = clientRuntimeConfig(chosenProfile);

            await testClient(runtime);

            const exact = await findExactInSelectedClient(
                hashes,
                runtime
            );

            if (exact) {
                notify(
                    `Torrent exact déjà présent dans ${getClientDisplayName(chosenProfile)}`,
                    "warning"
                );
                return;
            }

            notify(
                `Envoi vers ${getClientDisplayName(chosenProfile)}…`,
                "info",
                7000
            );

            const currentProvider = getProviderForHost(
                pageContext?.host ||
                location.hostname
            );

            const added = await addBufferToSelectedClient(
                torrent.buffer,
                torrent.filename,
                hashes,
                runtime,
                {
                    tracker: currentProvider?.label || "",
                    resolution: currentRelease.resolution,
                    codec: currentRelease.codec,
                    source: currentRelease.source,
                    seeders: currentRelease.seeders,
                    size: currentRelease.size
                }
            );

            if (added.conflictWithoutMatch) {
                throw new Error(
                    `${getClientDisplayName(chosenProfile)} : conflit lors de l'ajout`
                );
            }

            if (added.duplicate) {
                notify(
                    `Torrent déjà présent dans ${getClientDisplayName(chosenProfile)}`,
                    "warning"
                );
                return;
            }

            notify(
                `✓ Envoyé vers ${getClientDisplayName(chosenProfile)}` +
                (resolution
                    ? " — " + formatResolution(resolution)
                    : ""),
                "success"
            );
        } catch (error) {
            console.error("[PornScout]", error);
            notify("✕ " + error.message, "error", 6500);
        }
    }


    // ============================================================
    // DÉTECTION DES LIENS DE TÉLÉCHARGEMENT
    // ============================================================

    function looksLikeTorrentDownload(anchor) {
        if (!anchor || !anchor.href) {
            return false;
        }

        const href = anchor.href.toLowerCase();
        const text = (anchor.innerText || anchor.textContent || "").trim().toLowerCase();
        const title = (anchor.getAttribute("title") || "").toLowerCase();

        const urlPatterns = [
            ".torrent",
            "/download",
            "/dl/",
            "download.php",
            "download?id=",
            "download=",
            "torrent/download",
            "torrent_download",
            "download_torrent",
            "action=download",
            "type=torrent",
            "gettorrent",
            "downloadtorrent"
        ];

        if (urlPatterns.some(pattern => href.includes(pattern))) {
            return true;
        }

        const textPatterns = [
            "download torrent",
            "download .torrent",
            "télécharger torrent",
            "télécharger le torrent",
            "télécharger .torrent",
            "torrent download"
        ];

        if (textPatterns.some(pattern => text.includes(pattern))) {
            return true;
        }

        if (text === "torrent") {
            return true;
        }

        return (
            title.includes("torrent") &&
            (title.includes("download") || title.includes("télécharger"))
        );
    }

    // ============================================================
    // INTERCEPTION
    // ============================================================

    document.addEventListener("click", event => {
        // Ctrl+clic : bypass volontaire, comportement natif du navigateur.
        if (event.ctrlKey) {
            return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
            return;
        }

        const anchor = target.closest("a");

        if (!anchor || !looksLikeTorrentDownload(anchor)) {
            return;
        }

        // Ne pas intercepter les liens placés dans nos propres fenêtres.
        if (anchor.closest(".qbd-overlay")) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Capturer le vrai titre/ contexte AVANT toute requête réseau.
        // Cela évite d'utiliser le "name" numérique interne du .torrent comme identité.
        const pageContext = capturePageContext(anchor);

        sendToClient(anchor.href, pageContext);
    }, true);


    // ============================================================
    // BOUTON FLOTTANT PORNSCOUT
    // ============================================================

    function updateFloatingButtonTooltip() {
        const button = document.getElementById("pornscout-floating-button");
        if (button) {
            button.title = t("floatingTooltip");
            button.setAttribute("aria-label", t("floatingTooltip"));
        }
    }

    function createFloatingButton() {
        if (document.getElementById("pornscout-floating-button")) {
            return;
        }

        ensureStyles();

        const button = document.createElement("button");
        button.id = "pornscout-floating-button";
        button.type = "button";
        button.title = t("floatingTooltip");
        button.setAttribute("aria-label", t("floatingTooltip"));
        button.innerHTML = `<img src="${svgToDataUri(PORNSCOUT_ICON_SVG)}" alt="">`;

        const saved = GM_getValue(FLOAT_POS_KEY, null);
        const fallback = { right: 18, bottom: 90 };

        if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
            const left = Math.min(Math.max(0, saved.left), Math.max(0, window.innerWidth - 52));
            const top = Math.min(Math.max(0, saved.top), Math.max(0, window.innerHeight - 52));
            button.style.left = left + "px";
            button.style.top = top + "px";
        } else {
            button.style.right = fallback.right + "px";
            button.style.bottom = fallback.bottom + "px";
        }

        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        button.addEventListener("pointerdown", event => {
            dragging = true;
            moved = false;

            const rect = button.getBoundingClientRect();
            startX = event.clientX;
            startY = event.clientY;
            startLeft = rect.left;
            startTop = rect.top;

            button.style.left = rect.left + "px";
            button.style.top = rect.top + "px";
            button.style.right = "auto";
            button.style.bottom = "auto";

            button.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        });

        button.addEventListener("pointermove", event => {
            if (!dragging) return;

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                moved = true;
            }

            const left = Math.min(
                Math.max(0, startLeft + dx),
                Math.max(0, window.innerWidth - button.offsetWidth)
            );

            const top = Math.min(
                Math.max(0, startTop + dy),
                Math.max(0, window.innerHeight - button.offsetHeight)
            );

            button.style.left = left + "px";
            button.style.top = top + "px";
        });

        button.addEventListener("pointerup", event => {
            if (!dragging) return;
            dragging = false;

            button.releasePointerCapture?.(event.pointerId);

            const rect = button.getBoundingClientRect();
            GM_setValue(FLOAT_POS_KEY, {
                left: Math.round(rect.left),
                top: Math.round(rect.top)
            });

            if (!moved) {
                openConfigModal({ firstRun: false });
            }
        });

        window.addEventListener("resize", () => {
            const rect = button.getBoundingClientRect();
            const left = Math.min(Math.max(0, rect.left), Math.max(0, window.innerWidth - button.offsetWidth));
            const top = Math.min(Math.max(0, rect.top), Math.max(0, window.innerHeight - button.offsetHeight));
            button.style.left = left + "px";
            button.style.top = top + "px";
            button.style.right = "auto";
            button.style.bottom = "auto";
        });

        document.body.appendChild(button);
    }

    // ============================================================
    // MENU + PREMIER LANCEMENT
    // ============================================================

    GM_registerMenuCommand(t("configMenu"), () => {
        openConfigModal({ firstRun: false });
    });

    GM_registerMenuCommand(t("testMenu"), async () => {
        try {
            const profile = getDefaultClientProfile();

            if (!profile) {
                throw new Error("Aucun client BitTorrent configuré");
            }

            const version = await testClient(
                clientRuntimeConfig(profile)
            );

            notify(
                `✓ ${getClientDisplayName(profile)} accessible — ${version}`,
                "success"
            );
        } catch (error) {
            notify("✕ " + error.message, "error", 6500);
        }
    });

    log("PornScout actif", {
        version: SCRIPT_VERSION,
        host: location.hostname
    });

    assertPornScoutRuntime();
    createFloatingButton();

    if (!hasAnyClientConfig()) {
        setTimeout(() => {
            openConfigModal({ firstRun: true });
        }, 350);
    }
})();
