# 响应式设计(参考vue.js设计与实现)

​	总共由三个文件组成

+ index.html	 (html页面)
+ index.js          (js文件)
+ reactive.js      (数据响应式)

### 1.index.html

​	该文件作用不大，只是用来更直观的看到数据响应式

~~~ html
// 核心代码
<body>
    <div id="app"></div>
    <button id="btn">增加</button> // 用来测试页面响应式
    <script type="module" src="index.js" />
</body>
~~~

### 2.index.js

​	主要的脚本文件，用来进行测试reactive文件和effect文件

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

### 3.reactive.js

> vue官方文档：https://cn.vuejs.org/guide/extras/reactivity-in-depth.html

+ proxy：数据代理
+ effect：副作用
+ track：事件跟踪
+ trigger：事件派发