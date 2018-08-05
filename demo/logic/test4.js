
// 声明依赖，三个模块会按顺序执行
yepjs.require(['jquery', 'jqUI.uicss', 'jqUI.main', 'jqTree.treecss', 'jqTree.main']);
yepjs.require('demo.logic.test3');

yepjs.define('test4', {
    ns: 'demo.logic',
    field: function () {
        console.log('jqTree可用: ' + typeof $.fn.tree)
        demo.logic.test3()
        console.log('demo.logic.test4 执行成功!');
    }
});

