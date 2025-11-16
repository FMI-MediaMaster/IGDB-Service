import '@prototypes';
import fetch from 'node-fetch';
import errors from '@media-master/http-errors';
import config from '@media-master/load-dotenv';
import {
    Query,
    OptionsSearchResponse,
    MediaOption,
    SimilarGamesResponse,
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
            .every(word => name.toLowerCase().toASCII().includes(word.toLowerCase().toASCII()));
    };

    private filterGames = (games: OptionsSearchResponse[], gameName: string): OptionsSearchResponse[] => {
        return games
            .filter(game => !this.badWords.some(word => game.name.toLowerCase().includes(word)))
            .filter(game => this.containsAllWords(game.name, gameName));
    };

    private mapGame = (game: OptionsSearchResponse): MediaOption => {
        const updatedGame: MediaOption = {
            id: game.id.toString(),
            name: Buffer.from(game.name, 'utf8').toString(),
        };
        if (game.first_release_date) {
            const releaseDate = new Date(game.first_release_date * 1000);
            updatedGame.name += ` (${releaseDate.getUTCFullYear()})`;
        }
        return updatedGame;
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
            const roman = parseInt(numberString, 10).toRoman();

            if (roman) updatedGames.push(...(await this.getOptions(name.replace(numberString, roman))));
        }

        return updatedGames;
    };

    private getInfo = async (name: string): Promise<Record<string, string>> => {
        return {};
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

        const ids: string = response[0]['similar_games'].map(gameId => gameId.toString()).join(',');
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
