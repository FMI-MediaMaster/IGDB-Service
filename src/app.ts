import cors from 'cors';
import helmet from 'helmet';
import routes from '@routes';
import express, { Express } from 'express';
import config from '@media-master/load-dotenv';
import {
    unknownEndpoint,
    responseExtensions,
    errorHandler,
    requestLogger,
    userExtractor
} from '@media-master/express-middleware';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger(config));
app.use(responseExtensions);
app.use('/', userExtractor(config.SECRET), routes);
app.use(unknownEndpoint);
app.use(errorHandler(config.NODE_ENV));

export default app;

