export interface Query {
    name?: string;
    id?: string;
};

export interface MediaOption {
    id: string;
    name: string;
};

export interface OptionsSearchResponse {
    name: string;
    id: string;
    first_release_date?: number;
};

export interface SimilarGamesResponse {
    similar_games: number[];
};

