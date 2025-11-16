import fetch from 'node-fetch';
import errors from '@media-master/http-errors';
import config from '@media-master/load-dotenv';
import {
    Query,
    OptionsSearchResponse,
    MediaOption,
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
    };

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
            if (!response.ok) return 'hello';

            return (await response.json() as { 'access_token': string })['access_token'] as string;
        } catch {
            return '';
        }
    };

    private toAscii = (str: string): string => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\p{ASCII}]/gu, '')
    };

    private toRoman = (num: number): string => {
        const romanValues: Record<string, number> = {
            M: 1000,
            CM: 900,
            D: 500,
            CD: 400,
            C: 100,
            XC: 90,
            L: 50,
            XL: 40,
            X: 10,
            IX: 9,
            V: 5,
            IV: 4,
            I: 1
        };
        let roman = '';
        for (const key in romanValues) {
            while (num >= romanValues[key]) {
                roman += key;
                num -= romanValues[key];
            }
        }
        return roman;
    }

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
            .every(word => this.toAscii(name.toLowerCase()).includes(this.toAscii(word.toLowerCase())));
    };

    private filterGames = (games: OptionsSearchResponse[], gameName: string): OptionsSearchResponse[] => {
        return games
            .filter(game => !this.badWords.some(word => game.name.toLowerCase().includes(word)))
            .filter(game => this.containsAllWords(game.name, gameName));
    };


    private getOptions = async (name: string): Promise<MediaOption[]> => {
        const accessToken = await this.getAccessToken();
        let games = await this.request<OptionsSearchResponse[]>(
            'games',
            {
                headers: this.authHeaders(accessToken),
                body: `fields id,first_release_date,name; search "${name}";`,
            }
        );
        if (!games) return [];

        games = this.filterGames(games, name);
        const updatedGames: MediaOption[] = [];
        for (const game of games) {
            const updatedGame: MediaOption = {
                id: game.id.toString(),
                name: Buffer.from(game.name, 'utf8').toString(),
            };
            if (game.first_release_date) {
                const releaseDate = new Date(game.first_release_date * 1000);
                updatedGame.name += ` (${releaseDate.getUTCFullYear()})`;
            }

            updatedGames.push(updatedGame);
        }

        // If the game at least one number, turn the first one into roman and search again
        const match = name.match(/(\d+)$/);
        if (match) {
            const numberString = match[1];
            const roman = this.toRoman(parseInt(numberString, 10));

            if (roman) {
                const extraGames: MediaOption[] = await this.getOptions(name.replace(numberString, roman));
                updatedGames.push(...extraGames);
            }
        }

        return updatedGames;
    };

    private getInfo = async (name: string): Promise<Record<string, string>> => {
        return {};
    };

    private getRecommendations = async (id: string): Promise<Record<string, string>[]> => {
        return [];
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
