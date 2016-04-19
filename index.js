'use strict';

/**
module.exports.redlock = {
  connection: 'redlock',
  prefix: 'redlock:',
  options: {
    driftFactor: 0.01,
    retryCount:  3,
    retryDelay:  200
  }
};
module.exports.connections = {
  redlock: {
    hosts: [{host: 'localhost', port: 6379}],
    password: 'xxxx'
  }
}
**/

var Redlock = require('redlock');
var redis = require('redis');
var _redlock;

var redlock = {
  lock: function (resource) {
    arguments[0] = redlock.options.prefix + resource;
    return _redlock.lock.apply(_redlock, arguments);
  }
};

module.exports = function (done) {
  var connectionName = framework.config.redlock.connection;
  var connectionConfig = framework.config.connections[connectionName];
  if(!connectionConfig) {
    throw new Error('Undefined connection ' + connectionName);
  }
  redlock.options = {prefix: framework.config.redlock.prefix};

  var clients = _.map(connectionConfig.hosts, function (host) {
    var options = _.extend({}, connectionConfig);
    delete options.hosts;
    options = _.extend({port: 6379}, options, host);
    return redis.createClient(options);
  });

  _redlock = new Redlock(
      // you should have one client for each redis node
      // in your cluster
      clients,
      _.extend({
        // the expected clock drift; for more details
        // see http://redis.io/topics/distlock
        driftFactor: 0.01,

        // the max number of times Redlock will attempt
        // to lock a resource before erroring
        retryCount:  3,

        // the time in ms between attempts
        retryDelay:  200
      }, framework.config.redlock.lockOptions)
    );

  framework.redlock = redlock;

  done();
};
