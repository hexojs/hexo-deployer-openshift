'use strict';

var should = require('chai').should(); // eslint-disable-line
var pathFn = require('path');
var util = require('hexo-util');
var fs = require('hexo-fs');
var Promise = require('bluebird');
var spawn = util.spawn;

var assetDir = pathFn.join(__dirname, '../assets');

describe('OpenShift deployer', function() {
  var baseDir = pathFn.join(__dirname, 'deployer_test');
  var publicDir = pathFn.join(baseDir, 'public');
  var fakeRemote = pathFn.join(baseDir, 'remote');
  var validateDir = pathFn.join(baseDir, 'validate');

  var ctx = {
    base_dir: baseDir,
    public_dir: publicDir,
    log: {
      info: function() {}
    }
  };

  var deployer = require('../lib/deployer').bind(ctx);

  function compareFile(a, b) {
    return Promise.all([
      fs.readFile(a),
      fs.readFile(b)
    ]).then(function(result) {
      result[0].should.eql(result[1]);
    });
  }

  beforeEach(function() {
    // Create a bare repo as a fake remote repo
    return fs.writeFile(pathFn.join(publicDir, 'foo.txt'), 'foo')
      .then(function(){

        return fs.mkdirs(fakeRemote)
      }).then(function() {
        return spawn('git', ['init', '--bare', fakeRemote]);
      });
  });

  afterEach(function() {
    return fs.rmdir(fakeRemote)
    .then(function() {
      return fs.rmdir(validateDir);
    })
    .then(function() {
      return fs.rmdir(baseDir);
    })
  });

  function clone() {
    // Clone the remote repo
    return spawn('git', ['clone', fakeRemote, validateDir, '--branch', 'master']);
  }

  function validate() {
    return clone().then(function() {
      // Check files
      return fs.readFile(pathFn.join(validateDir, 'public', 'foo.txt'));
    }).then(function(result) {
      result.should.eql('foo');

      // Check package.json
      return compareFile(pathFn.join(assetDir, 'package.json'), pathFn.join(validateDir, 'package.json'));
    }).then(function() {
      // Check server.js
      return compareFile(pathFn.join(assetDir, 'server.js'), pathFn.join(validateDir, 'server.js'));
    });
  }

  it('default', function() {
    return deployer({
      repo: fakeRemote,
      silent: true
    }).then(function() {
      return validate();
    });
  });

  it('server test');

  it('custom message', function() {
    return deployer({
      repo: fakeRemote,
      message: 'custom message',
      silent: true
    }).then(function() {
      return validate();
    }).then(function() {
      return spawn('git', ['log', '-1', '--pretty=format:%s'], {cwd: validateDir});
    }).then(function(content) {
      content.should.eql('custom message');
    });
  });
});
