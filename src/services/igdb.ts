import fetch from 'node-fetch';
import errors from '@media-master/http-errors';
import config from '@media-master/load-dotenv';
import {
    toASCII,
    toRoman,
    unixSecondsToDate,
} from '@utils';
import {
    Query,
    OptionsSearchResponse,
    MediaOption,
    SimilarGamesResponse,
    AccessToken,
    IGDBCompany,
    IGDBLink,
    IGDBWebsite,
    MediaInfo,
} from '@types';

export default class IgdbService {
    private readonly params: Record<string, string>;
    private readonly badWords = ['bundle', 'pack'];

    constructor() {
        this.params = {
            'client_id': config.IGDB_ID,
            'client_secret': config.IGDB_SECRET,
            'grant_type': 'client_credentials'
        };
    }

    private authHeaders = (accessToken: string): Record<string, string> => {
        return {
            'Client-ID': config.IGDB_ID,
            'Authorization': `Bearer ${accessToken}`,
        };
    };

    private getAccessToken = async (): Promise<string> => {
        try {
            const url = new URL('https://id.twitch.tv/oauth2/token');
            const response = await fetch(url, {
                method: 'POST',
                body: new URLSearchParams(this.params)
            });
            if (!response.ok) return '';

            return (await response.json() as AccessToken)['access_token'];
        } catch {
            return '';
        }
    };

    private request = async <T>(
        endpoint: string,
        {
            headers,
            body
        }: {
            headers: Record<string, string>,
            body: string
        }
    ): Promise<T | undefined> => {
        const url = new URL(`https://api.igdb.com/v4/${endpoint}`);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        if (!response.ok) return undefined;
        return (await response.json()) as T;
    };

    private containsAllWords = (name: string, gameName: string): boolean => {
        return gameName
            .replaceAll(':', '')
            .split(' ')
            .every(word => toASCII(name.toLowerCase()).includes(toASCII(word.toLowerCase())));
    };

    private filterGames = (games: OptionsSearchResponse[], gameName: string): OptionsSearchResponse[] => {
        return games
            .filter(game => !this.badWords.some(word => game.name.toLowerCase().includes(word)))
            .filter(game => this.containsAllWords(game.name, gameName));
    };

    private mapGame = (game: OptionsSearchResponse | MediaInfo): MediaOption => {
        const updatedGame: MediaOption = {
            id: game.id.toString(),
            name: game.name,
        };
        if (game.first_release_date) {
            updatedGame.name += ` (${unixSecondsToDate(game.first_release_date).getUTCFullYear()})`;
        }
        return updatedGame;
    };

    private enrichGame = async (accessToken: string, game: MediaInfo): Promise<MediaInfo> => {
        // helpers
        const getURL = (u: IGDBLink) => `https:${u.url.replace('thumb', 'original')}`;
        const getField = <T, K extends keyof T>(field: K) => (x: T | string): T[K] | string => {
            if (typeof x === 'object' && x !== null && field in x) {
                return x[field as K];
            }
            if (typeof x === 'string') return x;
            return ''
        };
        const getCompanies = (role: 'developer' | 'publisher') => {
            return (game.involved_companies as IGDBCompany[])
                .filter((c: IGDBCompany) => c[role])
                .map(getField('company'))
        };
        const joinOn = <K extends keyof MediaInfo>(field: K) => {
            const value = game[field];
            if (!Array.isArray(value) || value.length === 1) return value;
            return `(${value.join(',')})`;
        };

        const fetchAndSet = async <
            T = { id: string, name: string },
            K extends keyof MediaInfo = keyof MediaInfo
        >({
            endpoint,
            fields,
            where = '',
            key = undefined,
            transform = (items: T[] | undefined) => items as unknown as MediaInfo[K],
        }: {
            endpoint: string;
            fields: string[];
            where? : string;
            key?: K;
            transform?: (items: T[] | undefined) => MediaInfo[K];
        }) => {
            try {
                const body = `fields ${fields.join(',')}; ${where}`;
                const data = await this.request<T[]>(endpoint, {
                    headers: this.authHeaders(accessToken),
                    body
                });

                key = key ?? (endpoint as K);;
                game[key] = transform(data);
            } catch {
                // ignored
            }
        };

        // initialization
        game = {
            artworks: [],
            collections: [],
            franchises: [],
            links: [],
            description: game.summary,
            critics_score: Math.round(game?.aggregated_rating ?? 0),
            community_score: Math.round(game?.rating ?? 0),
            release_date:  unixSecondsToDate(game.first_release_date ?? 0).toISOString().split('T')[0],
            ...game,
            ...this.mapGame(game),
        };
        if (game.collection) game.collections!.push(game.collection);
        if (game.franchise) game.franchises!.push(game.franchise);

        // first fetch
        await Promise.all([
            fetchAndSet<{ url: string }>({
                endpoint: 'artworks',
                fields: ['url'],
                where: `where id = ${joinOn('artworks')};`,
                transform: arr => arr?.map(getURL),
            }),
            fetchAndSet<{ url: string }>({
                endpoint: 'covers',
                fields: ['url'],
                where: `where id = ${game['cover']};`,
                key: 'cover',
                transform: arr => arr ? getURL(arr[0]) : '',
            }),
            fetchAndSet({
                endpoint: 'websites',
                fields: ['url', 'type'],
                where: `where game = ${game['id']};`,
            }),
            fetchAndSet({
                endpoint: 'involved_companies',
                fields: ['company', 'developer', 'publisher'],
                where: `where id = ${joinOn('involved_companies')} & (developer = true | publisher = true);`,
            }),
            fetchAndSet({
                endpoint: 'genres',
                fields: ['name'],
                where: `where id = ${joinOn('genres')};`,
                transform: arr => arr?.map(getField('name')),
            }),
            fetchAndSet({
                endpoint: 'platforms',
                fields: ['name'],
                where: `where id = ${joinOn('platforms')};`,
                transform: arr => arr?.map(getField('name')),
            }),
            fetchAndSet({
                endpoint: 'collections',
                fields: ['name'],
                where: `where id = ${joinOn('collections')};`,
                transform: arr => arr?.map(getField('name')) ?? [],
            }),
            fetchAndSet({
                endpoint: 'franchises',
                fields: ['name'],
                where: `where id = ${joinOn('franchises')};`,
                transform: arr => arr?.map(getField('name')) ?? [],
            }),
        ]);
        game = {
            ...game,
            series: [...game.franchises!.map(String), ...game.collections!.map(String)],
            creators: getCompanies('developer'),
            publishers: getCompanies('publisher'),
            links_list: (game.websites as IGDBWebsite[]),
            websites: game.websites.map(getField('type')),
            involved_companies: game.involved_companies.map(getField('company')),
        };

        // second fetch
        await Promise.all([
            fetchAndSet({
                endpoint: 'companies',
                fields: ['name'],
                where: `where id = ${joinOn('involved_companies')};`,
                key: 'companies_map',
                transform: arr => arr?.reduce((acc, c) => {
                    acc[c.id] = c.name;
                    return acc;
                }, {} as Record<string, string>)
            }),
            fetchAndSet<{ id: string, type: string }>({
                endpoint: 'website_types',
                fields: ['type'],
                where: `where id = ${joinOn('websites')};`,
                key: 'websites_map',
                transform: arr => arr?.reduce((acc, w) => {
                    acc[w.id] = w.type;
                    return acc;
                }, {} as Record<string, string>)
            }),
        ]);
        game = {
            ...game,
            creators: game.creators.map((key: string) => game.companies_map![key]),
            publishers: game.publishers.map((key: string) => game.companies_map![key]),
            links: [
                ...game.links_list!.map((link: IGDBWebsite) => ({ name: game.websites_map![link.type], url: link.url })),
                { name: 'IGDB', url: game.url! }
            ]
        };

        // cleanup
        const keysToDelete: (keyof MediaInfo)[] = [
            'first_release_date',
            'summary',
            'aggregated_rating',
            'rating',
            'franchise',
            'franchises',
            'collection',
            'collections',
            'url',
            'links_list',
            'websites',
            'websites_map',
            'involved_companies',
            'companies_map',
        ];
        keysToDelete.forEach(key => {
            delete game[key];
        });

        return game;
    };

    private getOptions = async (name: string): Promise<MediaOption[]> => {
        const accessToken = await this.getAccessToken();
        const games = await this.request<OptionsSearchResponse[]>(
            'games',
            {
                headers: this.authHeaders(accessToken),
                body: `fields id,first_release_date,name; search "${name}";`,
            }
        );
        if (!games) return [];

        const updatedGames = this.filterGames(games, name).map(this.mapGame);

        // If the game name has at least one number, turn the first one into roman and search again
        const match = name.match(/(\d+)$/);
        if (match) {
            const numberString = match[1];
            const roman = toRoman(parseInt(numberString, 10));

            if (roman) updatedGames.push(...(await this.getOptions(name.replace(numberString, roman))));
        }

        return updatedGames;
    };

    private getInfo = async (id: string): Promise<MediaInfo> => {
        const accessToken = await this.getAccessToken();
        const game = await this.request<MediaInfo[]>(
            'games',
            {
                headers: this.authHeaders(accessToken),
                body: `fields id,aggregated_rating,artworks,collection,collections,cover,first_release_date,franchise,genres,involved_companies,name,platforms,rating,summary,url,websites; where id = ${id};`,
            }
        );
        if (!game || !game[0]) throw errors.notFound('Game not found');
        return await this.enrichGame(accessToken, game[0]);
    };

    private getRecommendations = async (id: string): Promise<MediaOption[]> => {
        const accessToken = await this.getAccessToken();
        const response = await this.request<SimilarGamesResponse[]>(
            'games',
            {
                headers: this.authHeaders(accessToken),
                body: `fields similar_games; where id = ${id};`,
            }
        );
        if (!response || response.length === 0) return [];

        const ids: string = response[0]['similar_games'].join(',');
        const similarGames = await this.request<OptionsSearchResponse[]>(
            'games',
            {
                headers: this.authHeaders(accessToken),
                body: `fields id,first_release_date,name; where id = (${ids}) & version_parent = null & parent_game = null;`,
            }
        );
        if (!similarGames) return [];

        return similarGames.map(this.mapGame);
    };

    public handle = async (method: string, query: Query): Promise<unknown> => {
        const methodMap: Record<string, (param: string) => Promise<unknown>> = {
            options: this.getOptions,
            info: this.getInfo,
            recommendations: this.getRecommendations
        };

        if (!(method in methodMap)) {
            throw errors.notFound(
                'Invalid endpoint! Use /[options|info|recommendations]'
            );
        }

        const param = query[method === 'options' ? 'name' : 'id'];
        if (param === undefined) throw errors.badRequest(`Missing parameter for the ${method} endpoint`);

        return await methodMap[method](param);
    };
}
