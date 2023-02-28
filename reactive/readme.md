# 响应式设计(参考vue.js设计与实现)

​	总共由三个文件组成

+ index.html	 (html页面)
+ index.js          (js文件)
+ reactive.js      (数据响应式)

>  需要下载一个live server插件才能跑起来index.html文件否则会报错

### 1 - index.html

该文件作用不大，只是用来更直观的看到数据响应式

~~~ html
// 核心代码
<body>
    <div id="app"></div>
    <button id="btn">增加</button> // 用来测试页面响应式
    <script type="module" src="index.js" />
</body>
~~~

### 2 - index.js

主要的脚本文件，用来进行测试reactive文件和effect文件

```javascript
// 引入两个模块
import {reactive,effect} from "./reactive.js"

let app = document.getElementById('app')
let btn = document.getElementById('btn')

//创建响应式数据
const appData = reactive({name:1})
//添加页面响应式的副作用
effect(()=>{
    app.innerText = appData.name  
})
// 点击事件
btn.addEventListener('click',()=>{
    appData.text += 1
})
```

### 3 - reactive.js

> vue官方文档：https://cn.vuejs.org/guide/extras/reactivity-in-depth.html

+ proxy：数据代理

+ effect：副作用

+ track：事件跟踪
+ trigger：事件派发

#### 3.1 - 分支切换和cleanup

清除函数(cleanup)：用来进行合理的分支切换

​	遇到三目运算符 `temp = appData.ok? appData.text : appData.name`，如果appData.ok为true时，temp依赖的属性有ok和text，两者发生改变时应该改变，但是此时由于appData.ok的属性改变了，依赖就变成了ok和name，此时就形成的`分支切换`，按我们的需求讲，只需要name的值改变时，temp才变化，但是实际上却是，text的值发送改变，temp也会改变，不过由于ok的属性导致了分支不会往那条分支走，但是text所对应的函数还是会执行

​	方案：每一次收集副作用时，将与之关联的集合的切断联系

​	实施：给每个作用函数定义一个数组进行收集，让key与effect形成相互关联的联系

![image-20230208163123219](image-20230208163123219.png)

```javascript
// effect函数
let effect = (fn)=>{
    function effectfn(){
        cleanup(effectfn) // 执行
        ...
    }
    // 收集哪些该与副作用函数相关联的依赖集合
    effectfn.deps = []
    effectfn()
}
    
// 事件跟踪
let track = (target,key)=>{
    ...
    // 添加进去
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

//清除函数
let cleanup = (effectfn)=>{
    for(let i = 0; i < effectfn.deps.length; i ++){
        let deps = effectfn.deps[i];
        deps.delete(effectfn)
    }
    effectfn.deps.length = 0
}
```

