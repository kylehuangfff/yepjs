// 声明依赖
yepjs.require('demo.logic.test2'); 

yepjs.define('test3', {
    ns: 'demo.logic',
    field: function () {
        demo.logic.test2(); // 执行demo.logic.test2模块
        console.log('demo.logic.test3 执行成功!');
    }
});