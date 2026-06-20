import morgan from 'morgan';
import { StreamOptions } from 'morgan';
import logger from '../config/logger';

const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trimEnd()),
};

const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default httpLogger;
