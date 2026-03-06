import {
    faCube,
    faGamepad,
    faMicrochip,
    faNetworkWired,
    faTerminal,
    faDatabase,
    faCode,
    faGhost,
    faServer,
    faCloud,
    faRobot,
    faGlobe,
    faMemory,
} from '@fortawesome/free-solid-svg-icons';

export const getIconForServer = (image: string, name: string) => {
    const lowerImage = (image || '').toLowerCase();
    const lowerName = (name || '').toLowerCase();

    // Priority 1: Specific Game Identifiers
    const gameKeywords = [
        'minecraft', 'paper', 'spigot', 'forge', 'fabric', 'bungeecord', 'velocity', 'purpur',
        'terraria', 'tshock',
        'srcds', 'valve', 'csgo', 'cs2', 'garrysmod', 'gmod', 'tf2', 'l4d2',
        'ark', 'survival', 'rust', 'valheim', 'palworld', 'enshrouded',
        'satisfactory', 'factorio', 'v-rising', 'vrising',
        'dontstarve', 'dst', 'projectzomboid', 'zomboid',
    ];

    if (gameKeywords.some(k => lowerImage.includes(k) || lowerName.includes(k))) {
        if (lowerImage.includes('minecraft') || lowerName.includes('minecraft') || lowerImage.includes('paper') || lowerImage.includes('spigot')) {
            return faCube;
        }
        return faGamepad;
    }

    // Priority 2: Infrastructure & Tools
    if (lowerImage.includes('bot') || lowerName.includes('bot') || lowerName.includes('discord')) return faRobot;
    if (lowerImage.includes('panel') || lowerImage.includes('pterodactyl') || lowerName.includes('wing')) return faServer;
    if (lowerImage.includes('voice') || lowerImage.includes('ts3') || lowerImage.includes('mumble') || lowerName.includes('teamspeak')) return faNetworkWired;

    // Priority 3: Databases
    if (
        lowerImage.includes('mysql') || lowerImage.includes('mariadb') ||
        lowerImage.includes('postgres') || lowerImage.includes('redis') ||
        lowerImage.includes('mongo') || lowerImage.includes('sql') ||
        lowerName.includes('db') || lowerName.includes('database')
    ) return faDatabase;

    // Priority 4: Development & Web
    if (lowerImage.includes('python') || lowerName.includes('python') || lowerName.includes('.py')) return faCode;
    if (lowerImage.includes('node') || lowerImage.includes('js') || lowerName.includes('node') || lowerName.includes('.js')) return faCode;
    if (lowerImage.includes('php') || lowerName.includes('php')) return faGlobe; // Web related
    if (lowerImage.includes('rust') && !lowerImage.includes('survival')) return faCode;
    if (lowerImage.includes('java') && !lowerImage.includes('minecraft')) return faCode;
    if (lowerImage.includes('go') && !lowerImage.includes('gmod')) return faCode;

    if (lowerImage.includes('web') || lowerImage.includes('nginx') || lowerImage.includes('apache')) return faGlobe;
    if (lowerImage.includes('dotnet') || lowerImage.includes('aspnet') || lowerName.includes('service')) return faMicrochip;

    // Priority 5: Generic Docker/System
    if (lowerImage.includes('docker') || lowerImage.includes('ubuntu') || lowerImage.includes('debian') || lowerImage.includes('alpine')) return faTerminal;

    return faServer;
};
