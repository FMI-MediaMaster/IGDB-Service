import { Request, Response } from 'express';
import IgdbService from '@services/igdb';

export default class IgdbController {
    static async handler(req: Request, res: Response): Promise<void> {
        const igdb: IgdbService = new IgdbService();
        res.ok(await igdb.handle(req.params.method, req.query) as object);
    };
};
