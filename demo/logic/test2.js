// 声明依赖
yepjs.require('jquery'); 
yepjs.require('demo.logic.test1'); 

yepjs.define('test2', {
    ns: 'demo.logic',
    field: function () {
        console.log('jQuery可用: ' + typeof $); // 输出jquery
        demo.logic.test1();         // 执行demo.logic.test1模块
        console.log('demo.logic.test2 执行成功!');
    }
});