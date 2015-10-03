import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';
import path from 'path';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import GitHubApi from 'github';
import Electron from 'electron-packager';
import Config from './package.json';

const $ = plugins();

const nodeDevResources = _.chain(Config.dependencies)
  .keys()
  .map((dep) => `node_modules/${dep}/**/*`)
  .value();

const resources = [
  'fonts/**/*',
  'stylesheets/*',
  'menus/**/*',
  'index.html',
  'package.json',
  'README.md',
  'LICSENSE',
  'icons/*',
].concat(nodeDevResources);

const PATHS = {
  APP: 'build',
  DIST: 'dist',
  TMP: 'tmp',
  ICON: 'icons'
}

let onError = (err) => {
  $.util.beep();
  $.util.log(err.toString());
  if (err.stack) {
    $.util.log('Stack trace', err.stack.toString());
  }
  this.emit('end');
};

async function mkdir(dir) {
  return new Promise((resolve, reject) => {
    mkdirp(dir, (err) => {
      if(err) {
        return reject(err);
      }
      resolve();
    });
  });
}

async function authenticate() {
  let github = new GitHubApi({
    version: "3.0.0",
    debug: true
  });

  github.authenticate({
    type: "oauth",
    token: process.env.APP_TOKEN
  });
}

async function executable(platform = 'all', arch = 'all') {
  return new Promise((resolve, reject) => {
    Electron({
      name: `${_.capitalize(Config.name)}`,
      platform,
      arch,
      version: '0.33.0',
      'app-version': `v${Config.version}`,
      'version-string': {
        'ProductVersion': `v${Config.version}`,
        'ProductName': `${_.capitalize(Config.name)}`,
      },
      dir: PATHS.APP,
      out: PATHS.DIST,
      icon: `./${PATHS.ICON}/mancy`,
      overwrite: true,
      asar: true
    }, (err, result) => {
      if(err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

const options = {
  react: {
    source: 'src/**/*.js',
    target: 'build',
    config: {
      stage: 0
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
  require('del').sync([PATHS.APP, PATHS.DIST]);
});

gulp.task('copy', () => {
  gulp.src(resources, { base: '.' })
    .pipe(gulp.dest(PATHS.APP));
});

gulp.task('watch', (cb) => {
  $.livereload.listen();
  runSequence(
    'clean', ['sass', 'react', 'copy'], () => {
      gulp.watch(options.sass.source, ['sass']);
      gulp.watch(options.react.source, ['react']);
      cb();
    }
  );
});

gulp.task('build', ['clean', 'sass', 'react', 'copy']);

gulp.task('package', ['build'], (cb) => {
  (async () => {
    try {
      let {platform, arch} = process;
      await executable(platform, arch);
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
      await executable();
      cb();
    } catch (err) {
      onError(err);
      cb(err);
    }
  })();
});


gulp.task('release',['build', 'packageAll'], (cb) => {
  (async () => {
    try {
      await authenticate();
      //TODO: create version commit, create release and upload assets
      cb();
    } catch(err) {
      onError(err);
      cb(err);
    }
  })();
});

gulp.task('default', ['watch']);
