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

#### 3.2 - computed和watch

##### computed

+ value：保存值（应该是利用了闭包的特性）
+ dirty：缓存值，为true时代表该数据时新的需要更新，为false时代表我只是读取数据，并没有对数据进行更改，可以用上次的值，减少开销
+ obj：内置封装的一个对象，并且构建一个getter，当读取由计算属性定义的值的value属性时会进行触发

```javascript
// 计算属性
const computed = (getter)=>{
    // console.log(getter)
    let value,dirty = true
    const effectfn = effect(getter,{
        lazy:true,
        scheduler(){
            if(!dirty) {
                dirty = true
                trigger(obj,'value')
            }
        }

    })
    const obj = {
        get value(){ 
            // 执行effectfn之前得先track
            track(obj,'value')
            if(dirty){
                value = effectfn()
                dirty = false
            }
            return value
        }     
    }
    return obj
}

//index.js
const computedData = computed(()=>{
    return appData.firstName + appData.lastName
})
console.log(computedData.value)
```

##### watch

+  traverse函数： 有时候监听的是整个对象，所以要对所有的进行一次读取追踪
+ source：监听对象
+ fn：回调函数
+ options
  + immediate
  + flush（post）

```javascript
const traverse = (value,seen = new Set())=>{
    if(typeof value !== 'object' || value === null || seen.has(value)) return ;
    seen.add(value)
    for(let k in value){
        traverse(value[k],seen)
    }
    return value
}

// 监视
const watch = (source,fn,options={})=>{
    let getter
    // 如果本身就是一个getter函数就只需要直接复制,如果是个对象就需要遍历一下该对象
    if(typeof source === 'function'){
        getter = source
    }else{
        getter = () => traverse(source)
    }
    // 新值旧值
    let oldValue,newValue
    // 对于立即监听的功能,所以需要将job函数的功能抽离出来
    let job = ()=>{
        newValue = effectfn()
        fn(newValue,oldValue)
        // 利用闭包记录旧值
        oldValue = newValue
    }
    let effectfn = effect(
        ()=>getter(),
        {   
            lazy:true,
            scheduler(){
                // 利用promise将任务加到微任务队列而不是立即执行，达到所需要的在组件更新后再执行的效果
                if(options?.flush === 'post'){
                    let p = new Promise.resolve()
                    p.then(job)
                }else{
                    job()
                }
            }
        }   
    )
    if(options?.immediate){
        job()
    }else{
        // 第一次不存在新旧值之说
        oldValue = effectfn()
    }
}
```

> 暂时未考虑其他数据类型，由于reactive函数功能只是简单实现