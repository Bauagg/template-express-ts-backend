import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { startServer } from './databases';
import httpLogger from './middlewares/http-logger';
import router from './router/indext';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ message: 'Server is running' });
});

app.use('/api', router);

startServer(app, PORT);

export default app;
