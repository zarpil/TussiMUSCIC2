import { MongoClient } from 'mongodb';
import fs from 'fs';

let MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const isDocker = fs.existsSync('/.dockerenv');
if (!isDocker && MONGODB_URI.includes('host.docker.internal')) {
  MONGODB_URI = MONGODB_URI.replace('host.docker.internal', '127.0.0.1');
}

let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in env variables');
    }
    client = await MongoClient.connect(MONGODB_URI);
  }
  return client;
}

export interface RichPresenceItem {
  id?: string;
  name: string;
  type: 'Watching' | 'Listening' | 'Playing' | 'Competing' | 'Streaming';
}

export interface SiteSettings {
  siteName: string;
  siteDescription?: string;
  metaImageUrl?: string;
  metaKeywords?: string;
  faviconUrl: string;
  navbarIconUrl: string;
  primaryColor: string; // "155 80% 50%" format
  primaryColorHex: string; // "#10b981" format
  privacyPolicy: string;
  termsOfService: string;
  
  // Background Customization
  bgType: 'aurora' | 'solid' | 'image' | 'gif';
  bgColor: string;
  bgUrl: string;
  auroraColor: 'green' | 'purple' | 'red' | 'cyan' | 'custom';
  auroraCustomColor: string;
  
  // Hero section
  heroSubtitle: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  botInviteUrl: string;

  // About section
  aboutTitle: string;
  aboutSubtitle: string;
  aboutCard1Title: string;
  aboutCard1Text: string;
  aboutCard2Title: string;
  aboutCard2Text: string;
  aboutCard3Title: string;
  aboutCard3Text: string;

  // Features section
  featuresTitle: string;
  featuresSubtitle: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;

  // Join section
  joinTitle: string;
  joinSubtitle: string;
  supportServerUrl: string;

  // Team section
  teamTitle: string;
  teamSubtitle: string;
  teamMember1Name: string;
  teamMember1Role: string;
  teamMember1Bio: string;
  teamMember1DiscordId: string;
  teamMember1Avatar: string;
  teamMember2Name: string;
  teamMember2Role: string;
  teamMember2Bio: string;
  teamMember2DiscordId: string;
  teamMember2Avatar: string;

  // Emojis mapping
  emojis: Record<string, string>;

  // Discord Playing Card customizer
  cardHeading: string;
  cardBody: string;
  cardSupportLabel: string;
  cardSupportUrl: string;
  cardWebPlayerLabel: string;
  cardWebPlayerUrl: string;
  cardShowHeading: boolean;
  cardShowTrackImage: boolean;
  cardShowInfo: boolean;
  cardShowButtons: boolean;
  cardShowLinks: boolean;
  cardSeparatorStyle: 'divider' | 'empty';
  cardSeparatorSize: 'small' | 'medium' | 'large';

  // Discord Rich Presence customizer
  presenceMode?: 'unset' | 'enabled' | 'disabled';
  presenceName?: string;
  presenceType?: 'Watching' | 'Listening' | 'Playing' | 'Competing' | 'Streaming';
  presenceStatus?: 'online' | 'idle' | 'dnd' | 'invisible';
  presenceStatuses?: string[];
  presenceStatusesText?: string;
  presenceItems?: RichPresenceItem[];

  // Premium Billing Customizations
  premiumEnabled?: boolean;
  premiumPrice?: number;
  premiumCurrency?: string;
  premiumCurrencySymbol?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  premiumSupportLink?: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'Tussi Music',
  siteDescription: 'Controla tu bot de música de Discord desde la web con estilo',
  metaImageUrl: '/tussi-logo.png',
  metaKeywords: 'tussi music, bot de musica discord, panel de musica, bot discord',
  faviconUrl: '/favicon.ico',
  navbarIconUrl: '/tussi-logo.png',
  primaryColor: '330 90% 60%',
  primaryColorHex: '#ff2d87',
  privacyPolicy: '',
  termsOfService: '',
  
  // Background defaults
  bgType: 'aurora',
  bgColor: '#0e0714',
  bgUrl: '',
  auroraColor: 'purple',
  auroraCustomColor: '#ff2d87',
  
  // Hero Defaults
  heroSubtitle: "La mejor experiencia musical para Discord",
  heroTitleLine1: "Siente el Sonido",
  heroTitleLine2: "Con Tussi Music.",
  heroDescription: "Streaming de audio en alta fidelidad para tu servidor de Discord. Deja que el ritmo fluya con máxima calidad y sin cortes.",
  botInviteUrl: "https://discord.com/oauth2/authorize?client_id=1310246126712127508&scope=bot&permissions=2151017536",

  // About Defaults
  aboutTitle: "La Historia de Tussi Music",
  aboutSubtitle: "Más que un bot — el compromiso de unir a las personas a través de la música.",
  aboutCard1Title: "Nacido por pasión",
  aboutCard1Text: "Tussi Music fue creado para los amantes de la música que creen que Discord merece un bot que suene tan nítido como un reproductor de estudio dedicado.",
  aboutCard2Title: "Rendimiento óptimo",
  aboutCard2Text: "Cada milisegundo cuenta. Optimizamos nuestro canal de audio para una reproducción sin retardo ni cortes en miles de servidores simultáneos.",
  aboutCard3Title: "Favorito de las comunidades",
  aboutCard3Text: "Desde grupos de amigos hasta grandes servidores de gaming — Tussi Music se adapta al ambiente de tu comunidad para mantener la fiesta encendida.",

  // Features Defaults
  featuresTitle: "¿Por qué elegir Tussi Music?",
  featuresSubtitle: "Todo lo que necesitas para una experiencia auditiva inigualable.",
  feature1Title: "Audio de Alta Fidelidad",
  feature1Desc: "Streaming ultra claro con soporte de calidad sin pérdidas.",
  feature2Title: "Reproducción 24/7",
  feature2Desc: "La música nunca se detiene. Siempre activo y listo en tus canales de voz.",
  feature3Title: "Filtros de Sonido",
  feature3Desc: "Bassboost, nightcore, 8D, vaporwave y muchos más efectos personalizados.",
  feature4Title: "Panel Web en Vivo",
  feature4Desc: "Gestiona colas de reproducción, letras sincronizadas y controles en tiempo real desde el navegador.",

  // Join Defaults
  joinTitle: "Únete a la Comunidad Tussi Music",
  joinSubtitle: "Obtén soporte, sugiere nuevas funciones, entérate de novedades y disfruta con miles de amantes de la música en nuestro servidor de Discord.",
  supportServerUrl: "https://discord.gg/jhag8t57eH",

  // Team Defaults
  teamTitle: "Conoce al Equipo",
  teamSubtitle: "Los desarrolladores detrás de Tussi Music.",
  teamMember1Name: "Desarrollador Principal",
  teamMember1Role: "Lead Developer",
  teamMember1Bio: "Creando el futuro de los bots de música para Discord.",
  teamMember1DiscordId: "775429424979378216",
  teamMember1Avatar: "",
  teamMember2Name: "Desarrollador Core",
  teamMember2Role: "Core Developer",
  teamMember2Bio: "Diseñando experiencias de audio fluidas y modernas.",
  teamMember2DiscordId: "775015391487197206",
  teamMember2Avatar: "",

  // Default Emojis
  emojis: {
    tick_emoji: "<a:tick:1378702853572530226>",
    cross_emoji: "<a:cross_aur:1468227655319949519>",
    ltr_arrow_emoji: "<a:arrow:1378703040156274688>",
    ltr_arrow_color_emoji: "<a:color_arrow:1378704561782394971>",
    music_disc_emoji: "<a:disc:1466446944846221457>",
    play_button_emoji: "<:aur_play:1378705660400762891>",
    loading_emoji: "<a:salesforce_load:1378703152374616104>",
    volume_down_emoji: "<:down_aur:1378700996317941770>",
    volume_up_emoji: "<:up_aur:1378700925098524742>",
    skip_emoji: "<:next_aur:1378699339316199424>",
    pause_emoji: "<:pause_aur:1378701219752575126>",
    loop_emoji: "<:loop_aur:1378701134729969734>",
    stop_emoji: "<:stop_aur:1378701066769666088>",
    autoplay_emoji: "<:autoplay_aur:1468215550688628849>",
    queue_emoji: "<:loop_aur:1468213848904564879>",
    queuelist_emoji: "<:list_aur:1468216766382608618>",
    lyrics_emoji: "<:lyrics_aur:1468216486895292531>",
    volume_emoji: "<:volume_aur:1468214753150111795>",
    listqueue_emoji: "<:list_aur:1468216766382608618>",
    off_emoji: "<:power_aur:1468214243034665203>",
    song_emoji: "<:track_aur:1468213498680053812>",
    seek_emoji: "<:seek_aur:1468216209018327070>",
    shuffle_emoji: "<:shuffle_aur:1468214974752096307>"
  },

  // Default Card Layout configuration
  cardHeading: "# {music_disc_emoji} **Reproduciendo Ahora**",
  cardBody: "●  **Título: ** **[{title} - {artist}]({track_uri})**\n●  **Fuente: ** {source}\n●  **Duración: ** {duration}\n● **Siguiente Canción:** {next_song}\n● **Canciones en Cola:** {songs_count}\n● **Pedido por: ** <@{requester_id}>",
  cardSupportLabel: "Servidor de Soporte",
  cardSupportUrl: "https://discord.gg/jhag8t57eH",
  cardWebPlayerLabel: "Reproductor Web",
  cardWebPlayerUrl: "http://localhost:3000",
  cardShowHeading: true,
  cardShowTrackImage: true,
  cardShowInfo: true,
  cardShowButtons: true,
  cardShowLinks: true,
  cardSeparatorStyle: 'divider',
  cardSeparatorSize: 'small',

  // Discord Rich Presence defaults (default: unset, so it checks .env, which defaults to OFF)
  presenceMode: 'unset',
  presenceName: '',
  presenceType: 'Listening',
  presenceStatus: 'online',
  presenceStatuses: ['{servers} servidores', 'Música 24/7 sin cortes'],
  presenceStatusesText: '{servers} servidores\nMúsica 24/7 sin cortes',
  presenceItems: [
    { id: '1', name: '{servers} servidores', type: 'Watching' },
    { id: '2', name: 'Música en Alta Calidad', type: 'Listening' },
    { id: '3', name: 'Reproducción 24/7', type: 'Playing' }
  ],

  // Premium defaults
  premiumEnabled: false,
  premiumPrice: 2.99,
  premiumCurrency: 'EUR',
  premiumCurrencySymbol: '€',
  razorpayKeyId: '',
  razorpayKeySecret: '',
  premiumSupportLink: 'https://discord.gg/jhag8t57eH'
};

// Cache settings in memory for 10 seconds to avoid querying MongoDB on every request
let cachedSettings: SiteSettings | null = null;
let lastFetched: number = 0;
const CACHE_TTL = 0; // Always fetch fresh settings from DB

export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cachedSettings && (now - lastFetched < CACHE_TTL)) {
    return cachedSettings;
  }

  if (!MONGODB_URI) {
    return DEFAULT_SETTINGS;
  }

  try {
    const client = await getClient();
    const db = client.db('aurora');
    const config = await db.collection('settings').findOne({ _id: 'site_config' as any });
    
    if (config) {
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...config
      };
    } else {
      cachedSettings = DEFAULT_SETTINGS;
    }
    lastFetched = now;
    return cachedSettings;
  } catch (error) {
    console.error('Failed to fetch site settings from DB, using defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  try {
    const client = await getClient();
    const db = client.db('aurora');
    
    await db.collection('settings').updateOne(
      { _id: 'site_config' as any },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    // Clear cache
    cachedSettings = null;
    lastFetched = 0;
    return true;
  } catch (error) {
    console.error('Failed to save site settings to DB:', error);
    return false;
  }
}
