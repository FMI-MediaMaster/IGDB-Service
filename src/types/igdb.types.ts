export interface Query {
    name?: string;
    id?: string;
};

export interface OptionsSearchResponse {
    name: string;
    id: string;
    first_release_date?: number;
};

export interface MediaOption {
    id: string;
    name: string;
};
