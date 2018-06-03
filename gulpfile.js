'use strict';

let gulp = require('gulp');
let jsmin = require('gulp-uglify');
let pump = require('pump');
let rename = require('gulp-rename');

// 入口程序
gulp.task('default', ()=>{
    gulp.watch(['./src/*.js'], ['jsmin']);
    gulp.start('jsmin');
});

// js压缩
gulp.task('jsmin', (callback)=> {
    pump([
        gulp.src(['./src/*.js']),
        jsmin(),
        rename({suffix: '.min'}),
        gulp.dest('./dist'),
        gulp.dest('./demo/lib')
    ], callback);
});