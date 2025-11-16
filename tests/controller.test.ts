import runMetadataTests, { Fields } from '@media-master/metadata-service-tests';
import { Express } from 'express';
import { describe } from 'vitest';
import app from '../src/app';

const server = app as Express;

describe('Controller', () => {
    const endpoint: string = '';
    const validMap: object = {
        'Hollow Knight': '14593',
        'God Of War': '19560',
        'Celeste': '26226',
    };
    const invalidMap: object = {
        'adasdasa': '-1',
        '' : 'Not a game',
        'nonExistentGame': 'nonExistentId',
    };
    const fieldsMap: Record<string, Fields> = {
        options: {
            id: { type: 'string' },
            name: { type: 'string' },
        },
        info: {
            id: { type: 'string' },
            name: { type: 'string' },
            release_date: { type: 'string' },
            url: { type: 'string' },
            cover: { type: 'string' },
            description: { type: 'string' },
            genres: { type: 'stringArray' },
            artworks: { type: 'stringArray' },
            platforms: { type: 'stringArray' },
            critics_score: { type: 'number' },
            series: { type: 'stringArray' },
            creators: { type: 'stringArray' },
            publishers: { type: 'stringArray' },
            links: { type: 'objectArray' },
        },
        recommendations: {
            id: { type: 'string' },
            name: { type: 'string' },
        },
    };
    runMetadataTests(
        server,
        endpoint,
        { validMap, invalidMap, fieldsMap, type: 'game' }
    );
});
