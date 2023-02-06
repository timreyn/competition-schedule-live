import { init } from './server';

const port = process.env.PORT ? +process.env.PORT : 8090;

init()
  .then((app) =>
    app.listen(port, '10.0.0.234', () => {
      console.log('Server is running on port', port);
    })
  )
  .catch((e) => console.error(e));
