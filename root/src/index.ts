import {ApplicationConfig, DashboardApiApplication} from './application';
import {RestBindings} from '@loopback/rest';
import * as dotenv from 'dotenv';
import {networkInterfaces} from 'os';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new DashboardApiApplication(options);
  await app.boot();
  await app.start();

  const port = await app.restServer.get(RestBindings.PORT);
  const host = await app.restServer.get(RestBindings.HOST) ?? '127.0.0.1';

  console.log(`Server is running on port ${port}.`);

  // If the host is '0.0.0.0', log all available IPv4 addresses.
  if (host === '0.0.0.0') {
    console.log('Accessible on all network interfaces:');
    const interfaces = networkInterfaces();
    Object.values(interfaces).forEach(ifaceGroup => {
      ifaceGroup?.forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`  - http://${iface.address}:${port}`);
        }
      });
    });
  } else {
    console.log(`Server is running at http://${host}:${port}`);
  }
  console.log(`Try http://127.0.0.1:${port}/ping`);

  return app;
}

if (require.main === module) {
  dotenv.config();
  // Run the application
  const config: ApplicationConfig = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      // By default, LoopBack binds to 127.0.0.1 (localhost).
      // Set the host to '0.0.0.0' to make the server accessible from other devices.
      host: process.env.HOST ?? '0.0.0.0',
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
