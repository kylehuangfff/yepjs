// 声明依赖，三个模块会按顺序执行
yepjs.require(['jquery', 'jqUI.uicss', 'jqUI.main']);

yepjs.define("test1", {

    ns: "demo.logic",

    field: function () {
        console.log("jqUI可用");
        console.log("demo.logic.test1 执行成功!");
    }
});