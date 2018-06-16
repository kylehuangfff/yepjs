# yep.js框架介绍

yepjs是一个超小型的js模块化框架，gzip压缩后只有3KB，具有以下几个核心特性：
1. 强制要求在定义模块时使用命名空间，开发者能以此对各类代码进行有效组织，快速搭建一个层次明确、容易扩展的业务架构。
2. 模块依赖管理，使得单一模块仅需要声明自身所依赖的模块，而无需关心这些模块对其他模块的依赖。
3. 仿后端语言的“同步依赖”写法，让你可以把依赖写在每个模块的顶部。
4. 核心api仅有4个，只需要5分钟即可上手使用。

## 适用场景

yepjs并不适用于所有业务场景，仅推荐在以下场景中使用：
1. 传统的PC类网站开发，非SPA类应用。
2. 在项目中使用了jQuery，以及各类jQuery插件，需要管理复杂的文件依赖关系。
3. 希望通过命名空间来组织项目代码的。

## 快速上手

### 一、如何安装
通过script标签引入yep.js（以下简称`基础库`），推荐每个页面仅引入`基础库`文件，其他模块则通过api异步引入。
```
<script src="lib/yep.js" data-path="" data-config="../config.js"></script>
```
### 二、目录结构
框架不对目录结构做强制要求，但是推荐将模块根据职能不同，拆分到不同的文件夹，如拆分成业务逻辑、组件、公共函数等。
```
demo
├── lib
│   ├── yep.js (基础库文件)
│   └── 其他第三方库/插件
├── logic (业务模块目录)
│   └── test1.js
│   └── test2.js
│   └── test3.js
├── helper (公共函数目录)
│   └── test.js
└── config.js (配置文件)
└── demo.html
```
### 三、模块路径配置
推荐将所有模块写到config.js文件里进行统一管理，并根据实际业务拆分到不同的文件夹。

1. 模块路径支持设置远程地址，方便调用第三方资源。
2. 本地模块路径则是指相对于`基础库`的路径。  

```javascript
// 项目文件路径配置
yepjs.config({
    jquery: 'http://apps.bdimg.com/libs/jquery/1.9.1/jquery.js',
    jqUI: {
        main: 'http://apps.bdimg.com/libs/jqueryui/1.9.2/jquery-ui.min.js',
        uicss: 'http://apps.bdimg.com/libs/jqueryui/1.9.2/themes/base/jquery.ui.all.css'
    },
    jqTree: {
        main: 'http://cdn.staticfile.org/jqtree/1.3.7/tree.jquery.min.js',
        treecss: 'http://cdn.staticfile.org/jqtree/1.3.7/jqtree.css'
    },
    demo: {
        logic: {
            test1: '../logic/test1.js', // 注意此模块的路径
            test2: '../logic/test2.js'，
            test3: '../logic/test3.js'
        },
        helper: {
            test: '../helper/test.js'
        }
    }
});

```
还可以通过设置`基础库`的data-path属性，来手动指定模块目录。
```
// 设置data-path属性为`基础库`的上一级路径，此时data-config所指定的配置文件路径也发生了变化
<script src="lib/yep.js" data-path="../" data-config="config.js"></script>
```
```
// 设置data-path属性为项目的根目录
<script src="lib/yep.js" data-path="/${root}/" data-config="config.js"></script>
```
此时本地模块路径的设置发生了变化
```javascript
// 项目文件路径配置
yepjs.config({
    demo: {
        logic: {
            test1: 'logic/test1.js', // 此模块被设置成相对于data-path的路径了
            test2: 'logic/test2.js'
        },
        helper: {
            test: 'helper/test.js'
        }
    }
});
```

data-path属性也支持设置成远程url，用于处理`基础库`与业务模块在不同域名的情况。
```javascript
// 设置data-path属性为远程url
<script src="lib/yep.js" data-path="http://mydomain.com/public/js/" data-config="config.js"></script>
```

`注意`：不能使用js或css作为模块路径名称，下面的写法会导致框架无法正确处理
```javascript
// 项目文件路径配置
yepjs.config({
    demo: {
        js: '${path_to_js}/xxx.js',
        css: '${path_to_css}/xxx.css',
    }
});

```

### 四、模块定义与依赖管理

下面介绍如何编写模块，以及如何处理依赖关系。

#### 1、定义一个简单模块
定义模块时，需声明该模块的名称、所处的命名空间、以及模块方法。

如下所示，定义一个位于demo.logic这个命名空间下的名为test1的模块，field字段设定为一个function。

可以通过demo.logic.test1() 调用该function。
```javascript
// demo/logic/test1.js

yepjs.define('test1', {
    ns: 'demo.logic',
    field: function () {
        // do something
    }
});
```
field字段也可以是任何合法的js表达式，如对象，数组，基础数据类型等等
```javascript
// demo/helper/test.js

yepjs.define('test', {
    ns: 'demo.helper',
    field: [1, 2, 3]
});

console.log(demo.helper.test); // => '1,2,3'
```
#### 2、声明模块依赖
yepjs支持在模块顶部声明依赖，类似后端语言的“同步依赖”写法。
1. 支持使用`模块名称`从配置文件中获取真实模块地址
2. 支持直接声明对远程文件的依赖

```javascript
// demo/logic/test2.js

// 在模块最顶部声明依赖
yepjs.require('jquery');  // 从配置文件中读取模块地址
//yepjs.require('http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js'); // 直接使用远程地址
yepjs.require('demo.logic.test1'); // 从配置文件中读取模块地址


yepjs.define('test2', {
    ns: 'demo.logic',
    field: function () {
        console.log($); // 输出jquery
        demo.logic.test1(); // 执行test1模块
    }
});
```
#### 3、深层次的模块依赖
`对于使用框架规范编写的模块来说`，每个模块仅需要声明自身所依赖的模块，而无需关心这些模块对其他模块的依赖。

如下所示，test3模块依赖于test2模块，但是`只需声明对test2的依赖即可`。
```javascript
// demo/logic/test3.js

// 在模块最顶部声明依赖
yepjs.require('demo.logic.test2'); 

yepjs.define('test3', {
    ns: 'demo.logic',
    field: function () {
        demo.logic.test2(); // 执行test2模块
    }
});
```
#### 4、第三方组件的依赖管理
第三方的组件，比如一些jQuery插件，并不使用框架的规范进行编写，因此需要用另外一种方式来引入。

请先看下面这钟`错误写法`：
```javascript
// demo/logic/test4.js

// 在模块最顶部声明依赖
yepjs.require('jquery'); 
yepjs.require('jqUI.uicss');
yepjs.require('jqUI.main');  // jqUI依赖于jQuery

yepjs.define('test4', {
    ns: 'demo.logic',
    field: function () {
        
    }
});
```
`错误原因：`require会最大程度的并行下载所有依赖模块，其加载方式是`无序`的，哪个模块先加载完是不确定的，如果 jqUI.main先于jQuery加载完成，就会抛出错误，因为此时jQuery还未加载完。

为了处理这个问题，框架提供了`顺序加载模块`的特性。

如下所示：
```javascript
// demo/logic/test4.js

// 在模块最顶部声明依赖
yepjs.require(['jquery', 'jqUI.uicss', 'jqUI.main']);  // 三个模块会按顺序加载

yepjs.define('test4', {
    ns: 'demo.logic',
    field: function () {
        
    }
});
```
还可能出现下面这种情况，此处jQuery只会被加载一次。框架会记录所有加载过的文件，因此不会出现重复加载的问题。
```javascript
// demo/logic/test4.js

// 在模块最顶部声明依赖
yepjs.require(['jquery', 'jqUI.uicss', 'jqUI.main']);  // 三个模块会按顺序加载
yepjs.require(['jquery', 'jqTree.*']); // 使用通配符写法

yepjs.define('test4', {
    ns: 'demo.logic',
    field: function () {
        
    }
});
```
### 五、模块的使用

框架提供了唯一的执行入口用于在html页面执行模块，`必须使用yepjs.use作为入口，否则将无法正常运行`。

```htmlbars
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <script src="lib/yep.min.js" data-path="" data-config="../config.js"></script>
</head>
<body>
    <script>
        yepjs.use({
            name: ['demo.logic.test3'],
            callback: function () {
                demo.logic.test3();
            }
        });
    </script>
</body>
</html>
```

## 注意事项

1. 深层次的模块依赖会导致加载的文件过多，影响页面性能，并增加初始callback的等待时间。
2. 命名空间的设定能起到有效组织的作用，但如果层级拆分过多，会存在命名空间过长，增加记忆负担的问题。
3. yepjs.use会深度遍历当前入口模块的所有依赖。如果其中某个依赖模块加载失败，那么callback将永远不会被执行。