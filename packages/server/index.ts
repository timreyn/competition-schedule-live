import fs from 'fs';
import http from 'http';
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import { json } from 'body-parser';
import jwt from 'jsonwebtoken';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import graphqlServerConfig from './graphql';
import { ApolloServer } from '@apollo/server';
import AuthRouter from './auth';
import db from './db';

dotenv.config({
  debug: true,
});

const port = process.env.PORT ?? '8080';
const PUBLIC_KEY = fs.readFileSync('public.key');

async function init() {
  const app = express();

  app.use(cors<cors.CorsRequest>());
  app.use(json());

  app.use(morgan('tiny'));

  app.use('/auth', AuthRouter);

  // TODO: This should be moved to a separate file
  // Authenticates user by verifying JWT token
  app.use((req, _, next) => {
    const { headers } = req;

    const split = headers?.authorization?.split(/\s/);

    if (!split || split.length < 2) {
      next();
      return;
    }

    if (split[0] !== 'Bearer') {
      next(null);
    }

    const token = split[1];

    jwt.verify(token, PUBLIC_KEY, (err, decoded) => {
      if (err) {
        return next(err);
      }

      req.user = decoded as User | undefined;
      next(null);
    });
  });

  const httpServer = http.createServer(app);

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  const server = new ApolloServer<AppContext>({
    ...graphqlServerConfig,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  // Ensure we wait for our server to start
  await server.start();

  app.use(
    '/graphql',
    (req, _, next) => {
      console.log('graphql', req.body.query);
      return next();
    },
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: req.user, db }),
    })
  );

  return app;
}

init()
  .then((app) =>
    app.listen(port, () => {
      console.log('Server is running on port', port);
    })
  )
  .catch((e) => console.error(e));
