/*
 * yepjs 1.1.0
 * @author kylehuang
 * @date   2018/04/20
 */
; (function (global) {

    // 避免重复创建全局yepjs对象
    if (global.yepjs) {
        return;
    }

    function isString(arg) {
        return Object.prototype.toString.call(arg) === "[object String]";
    }

    function isArray(arg) {
        return Object.prototype.toString.call(arg) === "[object Array]";
    }

    function isObject(arg) {
        return Object.prototype.toString.call(arg) === "[object Object]";
    }

    function isFunction(arg) {
        return Object.prototype.toString.call(arg) === "[object Function]";
    }

    function isUndefined(arg) {
        return typeof arg === "undefined";
    }

    function forEach(arg, callback) {
        if (!isArray(arg)) { return; }
        for (var i = 0, len = arg.length; i < len; i++) {
            callback(arg[i], i, arg);
        }
    }

    var mainLoader,
        configPath,
        yepjs = function (fn) {
            mainLoader.wait(fn);
        };

    yepjs.version = "1.1.0";

    yepjs.isArray = isArray;
    yepjs.isString = isString;
    yepjs.isObject = isObject;
    yepjs.isFunction = isFunction;
    yepjs.isUndefined = isUndefined;
    yepjs.forEach = forEach;

    // yepjs.js地址
    yepjs.basePath = "";

    // 设置配置信息
    yepjs.config = function (configData) {

        // 不允许使用js或css做为字段名
        var checkField = function (obj) {
            for (var key in obj) {
                if (key === "css" || key === "js") {
                    throw new Error("yepjs.config 不允许使用js或css做为字段名");
                } else if (isObject(obj[key])) {
                    checkField(obj[key]);
                }
            }
        };
        checkField(configData);

        for (var key in configData) {
            yepjs.config[key] = configData[key];
        }
    };

    /*
     * 定义模块
     * @name:     模块名称
     * @options:  对象表达式{ 
     *     @ns: 字符串，表示要扩充的命名空间 
     *     @field: js表达式
     * }
     * 
     *  // 声明一个save模块，并扩充到Myproject.Logic这个命名空间下
     *  // => 系统会自动创建名为Myproject的对象
     *  // var Myproject = {
     *  //     Logic: {
     *  //         save: ...
     *  //     }
     *  // }
     *  yepjs.define("save", {
     * 
     *      ns: "MyProject.Logic",
     * 
     *      field: function(){
     *          alert("save");
     *      }
     *  });
     */
    yepjs.define = function (name, options) {

        var options = options || {},
            curns = global,
            nsArr, i = 0, l;

        // 未传递name值则退出
        if (isUndefined(name)) {
            throw new Error("yepjs.define参数错误，name值未传递");
        }

        options.ns = options.ns || options.NS || options.namespace;

        // 未传递合法命名空间参数，则使用yepjs作为默认命名空间
        if (!isString(options.ns)) {
            curns = this;
            options.ns = "yepjs";
        }

        nsArr = options.ns.split(".");

        l = nsArr.length;

        return (function (i, ns) {

            var callee = arguments.callee, cur = nsArr[i], nscur = ns[cur];

            if (i === l || !cur) {
                return;
            }

            if (!nscur) {

                nscur = ns[cur] = {};

                if (i === l - 1) {

                    if (nscur[name]) {

                        throw new Error(options.ns + "." + name + "重复定义，请检查是否文件重复引入或者命名空间冲突");
                    }

                    nscur[name] = options.fields || options.field || {};

                    return nscur[name];

                } else {

                    return callee(++i, nscur);
                }
            }
            else if (nscur) {

                if (i === l - 1) {
                    if (nscur[name]) {
                        throw new Error(options.ns + "." + name + "重复定义，请检查是否文件重复引入或者命名空间冲突");
                    }
                    nscur[name] = options.fields || options.field || {};
                    return nscur[name];
                } else {
                    return callee(++i, nscur);
                }

            }

        })(i, curns);
    }

    /*
     * 文件加载器
     */
    yepjs.loader = (function () {

        var doc = document,
            scripts = doc.getElementsByTagName("script"),
            head = scripts[0].parentNode,
            basePath, allFiles = {};

        var allFileListener = {

            listeners: [],

            add: function (loader, url) {
                this.listeners.push({ loader: loader, url: url });
            },
            send: function (url) {
                var item;
                for (var i = 0, len = this.listeners.length; i < len; i++) {
                    item = this.listeners[i];
                    if (item.url === url && item.loader.files[url] !== "executed") {
                        item.loader.files[url] = "executed";
                        item.loader.triggerFn();
                    }
                }
            }
        };

        // 获取yep.js目录路径
        yepjs.basePath = basePath = (function () {

            var path = /^(.*?)yep(?:\.min)?\.js/i;
            for (var i = 0, l = scripts.length; i < l; i++) {
                if (path.test(scripts[i].getAttribute("src"))) {
                    configPath = scripts[i].getAttribute("data-config");
                    var userPath = scripts[i].getAttribute("data-path");
                    if (userPath) {
                        return userPath;
                    } else {
                        return RegExp.$1;
                    }
                }
            }
            return "";
        })();

        var loadCSS = function (url) {
            var css = doc.createElement("link");
            css.href = url;
            css.rel = "stylesheet";
            css.type = "text/css";

            return css;
        };

        var loadJS = function (url) {
            var script = doc.createElement("script");
            script.setAttribute("src", url);
            script.setAttribute("type", "text/javascript");
            script.setAttribute("charset", "utf-8");

            return script;
        }

        var fileLoader = function () {
            // 每个fileLoader实例下载过的文件
            this.files = {};
            // 等待执行的函数
            this.waitfn = [];
        };

        // 检查所有文件是否加载完成
        fileLoader.prototype.isReady = function (fileArr) {

            var status,
                files = this.files;

            if(isArray(fileArr) && fileArr.length > 0){
                for(var i = 0; i < fileArr.length; i++){
                    if(files[fileArr[i]] !== "executed"){
                        return false;
                    }
                }

                return true;
            }else{
                for (var s in files) {
                    status = this.files[s];
                    if (status !== "executed") {
                        return false;
                    }
                }
            }

            return true;
        }

        // 直接加载js，立即执行
        fileLoader.prototype.load = function (url, callback) {

            var t = this;

            url = yepjs.handlePath(url);

            if (!isUndefined(t.files[url]) && t.files[url] !== "waiting") {
                if (t.files[url] === "executed") {
                    isFunction(callback) && callback();
                } else {
                    isFunction(callback) && t.wait(callback, [url]);
                }
                return;
            }

            if (!isUndefined(allFiles[url]) && allFiles[url] !== "waiting") {
                t.files[url] = allFiles[url];
                if (allFiles[url] !== "executed") {
                    allFileListener.add(t, url);
                } else {
                    isFunction(callback) && callback();
                    t.triggerFn();
                }
                return;
            }

            var newFile;

            if (/\.css(?:\?|$)/.test(url)) {
                newFile = loadCSS(url);
            } else {
                newFile = loadJS(url);
            }

            t.files[url] = allFiles[url] = "loading";

            if (newFile.readyState) {
                newFile.onreadystatechange = function () {
                    if (newFile.readyState === "loaded" || newFile.readyState === "complete") {
                        newFile.onreadystatechange = null;
                        t.files[url] = allFiles[url] = "executed";
                        allFileListener.send(url);
                        isFunction(callback) && callback();
                        t.triggerFn();
                    }
                }
            } else {
                newFile.onload = function () {
                    t.files[url] = allFiles[url] = "executed";
                    allFileListener.send(url);
                    isFunction(callback) && callback();
                    t.triggerFn();
                }
            }

            newFile.onerror = function () {
                throw new Error(url + "加载失败！");
            }

            head.appendChild(newFile);

            return this;
        }

        // 执行队列中等待执行的函数
        fileLoader.prototype.triggerFn = function () {

            var notready = [];
            var curWait;

            while (curWait = this.waitfn.shift()) {
                if(isArray(curWait.files)){
                    if(this.isReady(curWait.files)){
                        isFunction(curWait.fn) && curWait.fn();
                    }else{
                        notready.push(curWait);
                    }
                }else{
                    if(this.isReady()){
                        isFunction(curWait.fn) && curWait.fn();
                    }else{
                        notready.push(curWait);
                    }
                }
            }
            this.waitfn = notready;
        }

        /*
         * 等待全部文件下载完成后才执行
         * @fn: 要添加到等待队列的函数
         */
        fileLoader.prototype.wait = function (fn, files) {

            this.waitfn.push({fn: fn, files: files});

            this.triggerFn();

            return this;
        }

        yepjs.mainLoader = mainLoader = new fileLoader();

        return fileLoader;
    })();

    /*
     * 从配置中读取模块文件地址
     */
    yepjs.getPath = function (name) {

        var timeStamp, httpPattern = /^(?:http|\/\/)/, filePattern = /(?:\.js|\.css)(?:\?|$)/;

        if (httpPattern.test(name) || filePattern.test(name)) {
            return name;
        }

        if (!name) {

            throw new Error(name + "文件路径未定义");
        }

        // 分离时间戳
        name = name.replace(/\?(.*?)$/, function (match) {
            timeStamp = RegExp.$1;
            return "";
        });

        var nameArr = name.split("."),
            i = 0;

        if (nameArr.length < 1) {

            throw new Error("模块 [" + name + "] 文件路径未定义");
        }

        var realpath = (function (i, ns) {

            var callee = arguments.callee, cur = nameArr[i], curns = ns[cur];

            if (!cur) {

                return ns;

            } else {

                if (cur === "*") {

                    if (isObject(ns)) {

                        var filearr = [];

                        (function (cns) {

                            var ccallee = arguments.callee;

                            for (var child in cns) {
                                var ccur = cns[child];
                                if (isString(ccur)) {
                                    filearr.push(ccur);
                                } else if (isObject(ccur)) {
                                    ccallee(ccur);
                                }
                            }
                        })(ns);

                        return filearr;
                    } else {
                        throw new Error("[" + name + "] 查找不到子模块");
                    }
                } else {
                    if (!curns) {

                        throw new Error("模块 [" + name + "] 文件路径未定义");
                    }
                    return callee(++i, curns);
                }
            }

        })(i, yepjs.config);

        timeStamp && (function () {

            function addstamp(str) {
                if (str.indexOf("?") > -1) {
                    str += "&" + timeStamp
                } else {
                    str += "?" + timeStamp
                }
                return str;
            }

            if (isString(realpath)) {
                realpath = addstamp(realpath);
            } else if (isArray(realpath)) {
                for (var k = 0; k < realpath.length; k++) {
                    realpath[k] = addstamp(realpath[k]);
                }
            }

        })();

        return realpath;
    }

    /**
     * 将模块文件地址处理成最终可加载的地址
     */
    yepjs.handlePath = function (url) {
        if (url.indexOf("http") > -1 || /^\/\//.test(url)) {
            return url;
        }

        var prePath = yepjs.basePath.split("/");
        var sufPath = url.split("/");

        if (sufPath[0] === "") {
            return url;
        }

        if (prePath[prePath.length - 1] === "") {
            prePath.pop();
        }

        var field;
        while (field = sufPath.shift()) {
            if (field === "..") {
                prePath.pop();
            } else if (field !== ".") {
                prePath.push(field);
            }
        }

        return prePath.join("/");
    }

    /*
     * 模块加载
     * 
     * // 示例1：加载单个模块，并执行回调
     * yepjs.use(
     *     {
     *         name: "yepjs.Data.bill",
     *         callback: function () {
     * 
     *         }
     *     }
     * );
     * 
     * // 示例2：加载多个模块，并执行回调
     * yepjs.use(
     *     {
     *         name: ["yepjs.Data.bill","yepjs.Model.bill"],
     *         callback: function () {
     * 
     *         }
     *     }
     * );
     * 
     * // 示例3：加载多个模块，并分别执行回调
     * yepjs.use(
     *     {
     *         name: ["yepjs.Business.bill","yepjs.Data.bill","yepjs.Model.bill"],
     *         callback: function () {
     * 
     *         }
     *     },
     *     {
     *         name: "yepjs.Data.product",
     *         callback: function () {
     * 
     *         }
     *     }
     * );
     */
    yepjs.use = function () {

        var arg = arguments, i = 0, callee = arg.callee;

        if (arg.length === 0) {
            return;
        }

        // 等待配置文件加载完成
        mainLoader.wait(function () {

            var path;

            for (; i < arg.length; i++) {

                (function (curArg) {

                    var loader = new yepjs.loader();

                    if (isString(curArg.name)) {

                        curArg.name = [curArg.name];
                    }

                    if (isArray(curArg.name)) {

                        yepjs.forEach(curArg.name, function (item) {

                            var files = yepjs.getPath(item);

                            if (isString(files)) {
                                files = [files];
                            }

                            yepjs.forEach(files, function (file) {
                                loader.load(file);
                            });
                        });

                        loader.wait(function () {
                            mainLoader.wait(curArg.callback);
                        });
                    }

                })(arg[i]);
            }
        });

    }

    /*
     * 依赖模块导入
     * 
     * 此方法用于在模块内部加载依赖模块，可加载在配置文件里预定义的模块，也可以加载url地址
     *
     * 示例1：每行加载一个模块
     * yepjs.require("jquery");
     * yepjs.require("MyProject.common");
     * 
     * 示例2：加载MyProject.Logic命名空间下的所有模块
     * yepjs.require("MyProject.Logic.*");
     * 
     * 示例3：如果某些第三方模块，存在其他依赖，则需指定模块加载顺序
     * // jqueryUI模块，依赖于jquery，系统会先加载完jquery后，再加载jqueryUI
     * yepjs.require(["jquery", "jqueryUI"]);
     * 
     * // 以下是错误示例，jqueryUI依赖于jquery，但是jquery不一定会在jqueryUI执行之前加载完
     * yepjs.require("jquery");
     * yepjs.require("jqueryUI");
     * 
     */
    yepjs.require = function (name) {

        if (isUndefined(name) || !name) {
            return;
        }

        var moduleArr, 
            moduleFiles = [],
            sync = false;

        if (isString(name)) {

            moduleArr = [name];

        } else if (isArray(name)) {

            moduleArr = name;
            sync = true;

        } else {

            throw new Error("yepjs.require参数错误，只支持字符串和数组参数");
        }

        yepjs.forEach(moduleArr, function (moduleName) {
            var moduleFile = yepjs.getPath(moduleName);
            moduleFiles = moduleFiles.concat(moduleFile);
        });

        // 无序加载
        var loadModule = function () {

            yepjs.forEach(moduleFiles, function (file) {
                mainLoader.load(file);
            });
        };

        // 顺序加载
        var syncLoadModule = function () {

            yepjs.forEach(moduleFiles, function (file, index) {
                var fileurl = yepjs.handlePath(file);
                if (!mainLoader.files[fileurl]) {
                    mainLoader.files[fileurl] = "waiting";
                }
            });

            (function (i) {

                var callee = arguments.callee, file = moduleFiles[i];

                if (isUndefined(file)) {
                    return;
                }

                mainLoader.load(file, function () {
                    callee(++i);
                });

            })(0);
        };

        if (sync) {
            syncLoadModule();
        } else {
            loadModule();
        }
    }

    // 使yepjs成为全局变量
    global["yepjs"] = yepjs;

    if (!isUndefined(configPath)) {
        // 导入配置文件
        yepjs.require(configPath);
    }

})(window);
