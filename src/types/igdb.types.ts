export interface AccessToken {
    access_token: string;
};

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

export interface IGDBCompany {
    developer: boolean;
    publisher: boolean;
    company: string;
};

export interface IGDBLink {
    url: string;
    name?: string;
};

export interface IGDBWebsite {
    type: string;
    url: string;
};

type IGDBId = number;

export interface MediaInfo {
    id: string;
    name: string;
    artworks?: string[];
    cover?: string;
    release_date?: string;
    first_release_date?: number;
    url?: string;
    series: string[];
    summary?: string;
    description?: string;
    critics_score?: number;
    community_score?: number;
    aggregated_rating?: number;
    rating?: number;
    genres?: (IGDBId | string)[];
    platforms?: (IGDBId | string)[];
    franchise?: IGDBId;
    franchises?: (IGDBId | string)[];
    collection?: IGDBId;
    collections?: (IGDBId | string)[];
    involved_companies: (IGDBCompany | string)[];
    links?: IGDBLink[];
    links_list?: IGDBWebsite[];
    websites: (IGDBWebsite | string)[];
    websites_map?: Record<string, string>;
    companies_map?: Record<string, string>;
    creators: string[];
    publishers: string[];
};
