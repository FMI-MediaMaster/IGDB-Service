import app from '@app';
import chalk from 'chalk';
import config from '@media-master/load-dotenv';

app.listen(config.PORT, () => {
    console.log(`${chalk.cyan('[STARTED]')} Listening at http://localhost:${config.PORT}`);
});

