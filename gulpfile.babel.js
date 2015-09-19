import gulp from "gulp";
import plugins from "gulp-load-plugins";
import runSequence from "run-sequence";

const $ = plugins();

function onError(err) {
  $.util.beep();
  $.util.log(err.toString());
  if (err.stack) {
    $.util.log("Stack trace", err.stack.toString());
  }
  this.emit("end");
}

const options = {
  react: {
    source: "src/**/*.js",
    target: "build",
    config: {
      stage: 0
    }
  },
  sass: {
    source: ["stylesheets/*.scss"],
    target: {
      path: "build/stylesheets/",
      name: "repl.css"
    },
    config: {
      errLogToConsole: true
    }
  }
};

gulp.task("sass", () =>
  gulp.src(options.sass.source)
    .pipe($.cached("sass"))
    .pipe($.sass(options.sass.config).on("error", onError))
    .pipe($.concat(options.sass.target.name))
    .pipe(gulp.dest(options.sass.target.path))
    .pipe($.livereload())
);

gulp.task("react", () =>
  gulp.src(options.react.source)
    .pipe($.babel(options.react.config).on("error", onError))
    .pipe($.react().on("error", onError))
    .pipe(gulp.dest(options.react.target))
);

gulp.task("clean", () => {
  require("del").sync(["build/**"]);
});

gulp.task("copy", () => {
  gulp.src(['fonts/*'])
    .pipe(gulp.dest('build/fonts'));
  gulp.src(['index.html'])
    .pipe(gulp.dest('build/'));
});

gulp.task("watch", cb => {
  $.livereload.listen();
  runSequence(
    "clean", ["sass", "react", "copy"], () => {
      gulp.watch(options.sass.source, ["sass"]);
      gulp.watch(options.react.source, ["react"]);
      cb();
    }
  );
});

gulp.task("default", ["watch"]);
gulp.task("build", ["clean", "sass", "react", "copy"]);
