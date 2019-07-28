'use strict';

const path = require('path');
const superstatic = require('superstatic');
const port = process.env.OPENSHIFT_NODEJS_PORT || 4000;
const host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

const app = superstatic({
  cwd: path.join(__dirname, 'public'),
  port: port,
  host: host
});

app.listen(err => {
  if (err) throw err;
  console.log('Server listening on http://%s:%s', host, port);
});
