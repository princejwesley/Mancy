import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';
import path from 'path';
import _ from 'lodash';
import {argv} from 'yargs';
import GitHubApi from 'github';
import Electron from 'electron-packager';
import Config from './package.json';
import semver from 'semver';
import ChildProcess from 'child_process';
import {writeFileSync} from 'fs';
import {basename, extname, dirname, resolve, join} from 'path';
import env from 'gulp-env';
let execSync = require('child_process').execSync;
import BabelPolyfill from "babel-polyfill";

const $ = plugins();
const electronVersion = require(resolve('node_modules', 'electron', 'package.json')).version;

const nodeResources = (() => {
  let result = execSync('npm list --prod --parseable');
  return _.chain(result.toString().trim().split(/\r?\n/))
    // remove app root path
    .tap((r) => r.shift())
    .filter((dep) => dep.match(/node_modules/g).length == 1 && !dep.match(/typescript/))
    .map((dep) => `${dep}/**/*.{js,cljs,css,json,svg,png,gif,woff2,otf,ttf,woff,eot,ts}`)
    .value();
})();

const excludes = [
  'test', 'spec', 'htdocs', 'build',
  'dist', 'example', 'samples'
].map(e => `!**/${e}/*`);

const resources = [
  'node_modules/coffee-script/bin/*',
  'node_modules/typescript/package.json',
  'node_modules/typescript/bin/tsc',
  'node_modules/typescript/lib/tsc.js',
  'node_modules/typescript/lib/typescript.js',
  'node_modules/typescript/lib/lib.core.es7.d.ts',
  'node_modules/livescript/bin/*',
  'node_modules/font-manager/**/*',
  '!**/*.min.js',
].concat(nodeResources).concat(excludes);


const resourcesInternal = [
  'fonts/**/*',
  'stylesheets/*',
  'menus/**/*',
  'index.html',
  'package.json',
  'README.md',
  'LICENSE',
  'icons/*',
  'logos/*',
];

const PATHS = {
  APP: 'build',
  DIST: 'dist',
  SRC: 'src',
  ICON: 'icons',
  STYLES: 'stylesheets'
};

let onError = (err) => {
  $.util.beep();
  $.util.log(err.toString());
  if (err.stack) {
    $.util.log('Stack trace', err.stack.toString());
  }
};

async function authenticate(api) {
  api.authenticate({
    type: "oauth",
    token: process.env.GITHUB_TOKEN
  });
}

let zipExe = async function(dists) {
  return Promise.all(_.map(dists, (dist) => {
    let name = basename(dist);
    return spawn('zip', [`${PATHS.DIST}/${name}.zip`, '-r', `${PATHS.DIST}/${name}`]);
  }));
}

let spawn = async function(command, args, options) {
  let cb = (resolve, reject) => {
    let exe = ChildProcess.spawn(command, args, options);
    exe.stdout.on('data', (data) => $.util.log(data.toString('utf8').trim()));
    exe.stderr.on('data', (err) => onError(err.toString('utf8')));
    exe.on('close', resolve);
    exe.on('error', reject);
  };
  return new Promise(cb);
}

let executable = async function(platform = 'all', arch = 'all', version = electronVersion) {
  let cb = (resolve, reject) => {
    Electron({
      name: `${_.capitalize(Config.name)}`,
      platform,
      arch,
      version: electronVersion,
      'app-version': `v${Config.version}`,
      'version-string': {
        'ProductVersion': `v${Config.version}`,
        'ProductName': `${_.capitalize(Config.name)}`,
      },
      dir: PATHS.APP,
      out: PATHS.DIST,
      icon: `./${PATHS.ICON}/mancy`,
      overwrite: true,
      // should be false so that user can open files inside asar
      asar: false
    }, (err, result) => {
      if(err) {
        return reject(err);
      }
      resolve(result);
    });
  };
  return new Promise(cb);
};

let releaseCommit = async function() {
  let {v} = argv;
  if(['major', 'minor', 'patch'].indexOf(v) === -1) {
    v = 'patch';
  }
  Config.version = semver.inc(Config.version, v);
  let newConfig = JSON.stringify(Config, null, 2);

  // update package.json
  writeFileSync('package.json', newConfig);

  await spawn('git', ['commit', '-m', `Release v${Config.version}`, 'package.json']);
  await spawn('git', ['push']);
};

let createRelease = async function(api) {
  let {url} = Config.repository;
  let owner = basename(dirname(url));
  let repo = basename(url, extname(url));

  let cb = (resolve, reject) => {
    api.releases.createRelease({
      owner: owner,
      repo: repo,
      tag_name: `v${Config.version}`,
      body: argv.desc || '',
      name: argv.name || `v${Config.version}`,
      draft: argv.draft === 'yes'
    }, (err, result) => {
      if(err) {
        onError(err);
        return reject(err);
      }
      resolve(result);
    });
  };
  return new Promise(cb);
};

let uploadAsset = async function(api, id, dists) {
  let {url} = Config.repository;
  let owner = basename(dirname(url));
  let repo = basename(url, extname(url));

  return Promise.all(_.map(dists, (dist) => {
    let name = `${basename(dist)}.zip`;
    let filePath = join(PATHS.DIST, name);
    return new Promise((resolve, reject) => {
      api.releases.uploadAsset({
        owner: owner,
        repo: repo,
        id: id,
        name: name,
        filePath: filePath
      }, (err, result) => {
        if(err) {
          onError(err);
          return reject(err);
        }
        resolve(result);
      });
    });
  }));
};

const options = {
  react: {
    source: ['src/**/*.js'],
    target: 'build',
    config: {
      "sourceMaps": "both",
      "presets": ["es2015", "react", "stage-0"],
      "plugins": ["add-module-exports"]
    }
  },
  sass: {
    source: ['stylesheets/*.scss'],
    target: {
      path: 'build/stylesheets/',
      name: 'repl.css'
    },
    config: {
      errLogToConsole: true
    }
  }
};

gulp.task('post-install',() => {
	
	
  
	const
    sh = require('shelljs'),
		fs = require('fs'),
		path = require('path'),
		pkg = require('./package.json'),
		electronVersion = pkg.devDependencies['electron']
	
	sh.cd('node_modules/font-manager')
	sh.exec(`node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://atom.io/download/atom-shell`)
	sh.cd('../..')
	
})

gulp.task('sass', () =>
  gulp.src(options.sass.source)
    .pipe($.cached('sass'))
    .pipe($.sass(options.sass.config).on('error', onError))
    .pipe($.concat(options.sass.target.name))
    .pipe(gulp.dest(options.sass.target.path))
    .pipe($.livereload())
);

gulp.task('react', () =>
  gulp.src(options.react.source)
    .pipe($.babel(options.react.config).on('error', onError))
    .pipe($.react().on('error', onError))
    .pipe(gulp.dest(options.react.target))
);

gulp.task('clean', () => {
  return require('del').sync([PATHS.APP, PATHS.DIST]);
});

gulp.task('watchableCopy', () => {
  gulp.src(['src/languages/typescript/*'], { base: 'src/' })
    .pipe(gulp.dest(PATHS.APP));
  return gulp.src(resourcesInternal, { base: '.' })
    .pipe(gulp.dest(PATHS.APP));
});

gulp.task('copy', ['watchableCopy'], () => {
  return gulp.src(resources, { base: '.' })
    .pipe(gulp.dest(PATHS.APP));
});

gulp.task('watch',['rebuild'], (cb) => {
  $.livereload.listen();
  gulp.watch(options.sass.source, ['sass']);
  gulp.watch(options.react.source, ['react']);
  gulp.watch('package.json', ['watchableCopy']);
  gulp.watch('README.md', ['watchableCopy']);
  gulp.watch('index.html', ['watchableCopy']);
  cb();
});

gulp.task('build', (cb) => {
  return runSequence('clean', 'copy', ['sass', 'react'], cb);
});

gulp.task('rebuild', (cb) => {
  return runSequence('watchableCopy', 'sass', 'react', cb);
});

gulp.task('package', ['build'], (cb) => {
  (async function() {
    try {
      let {platform, arch} = process;
      await executable(platform, arch, electronVersion);
      cb();
    } catch (err) {
      onError(err);
      cb(err);
    }
  })();
});

gulp.task('packageAll', ['build'], (cb) => {
  (async function() {
    try {
      await executable('darwin', 'all', electronVersion);
      await executable('win32', 'all', electronVersion);
      await executable('linux', 'all', electronVersion);
      cb();
    } catch (err) {
      onError(err);
      cb(err);
    }
  })();
});

gulp.task('run', (cb) => {
  (async function() {
    try {
      await spawn(
        process.platform !== 'win32'
          ? './node_modules/.bin/electron'
          : '.\\node_modules\\.bin\\electron.cmd'
        , [PATHS.APP, '--debug']);
      cb();
    } catch(err) {
      onError(err);
      cb(err);
    }
  })();
});

gulp.task('start',[], (cb) => runSequence('rebuild', 'run', cb));

gulp.task('debug', ['rebuild'], (cb) => runSequence('run', cb));

gulp.task('release',['build'], (cb) => {
  (async function() {
    try {
      let github = new GitHubApi({
        version: "3.0.0",
        debug: true
      });

      await authenticate(github);
      await releaseCommit();

      gulp.src(['package.json'], { base: '.' })
        .pipe(gulp.dest(PATHS.APP));

      let dists = await executable();

      await zipExe(dists);
      let {id} = await createRelease(github);
      await uploadAsset(github, id, dists);

      cb();
    } catch(err) {
      onError(err);
      cb(err);
    }
  })();
});

gulp.task('default', ['debug']);
