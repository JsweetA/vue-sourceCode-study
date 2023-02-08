// 利用proxy进行数据劫持（vue2中利用的是definepropty，考虑到新增属性那些，vue3改成了proxy，直接劫持整个对象）
const reactive = (obj)=>{
    return new Proxy(obj,{
        get(target,key){
            track(target,key)  
            return target[key]
        },
        set(target,key,newValue){
            target[key] = newValue
            trigger(target,key)
            return true
        }
    })
}

// 用来嵌套effect：
// 用栈记录副作用函数，并且执行完后，弹出，此时的活动函数如果在嵌套中，应该是外层的，所以用栈记录（vuejs设计与实现4.5）
let effectStack = []  
let activeEffect = null // 活动函数
// 中介：
let effect = (fn,options = {})=>{
    function effectfn(){
        cleanup(effectfn)
        activeEffect = effectfn
        effectStack.push(effect)
        const res = fn()
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1] // 回溯到上一个作用函数
        return res
    }
    // 收集哪些该与副作用函数相关联的依赖集合
    effectfn.deps = []

    // options:可实现调度器，懒加载
    effectfn.options = options

    // 如果lazy为true,则不立即执行
    if(!options.lazy){
        effectfn()
    }

    // 并且返回其函数，由用户控制什么时候执行
    return effectfn
}

// 存储响应式对象
let bucket = new WeakMap()
// 数据结构：
// weakmap ---- obj->key(map)
// map     ---- key->effect(set)

// 事件跟踪
let track = (target,key)=>{
    // console.log("track",key)
    //  如果没有副作用则直接返回
    if(!activeEffect) return ;

    // 通过对象拿到对应的键值(map类型)
    let depsMap = bucket.get(target)

    // 不存在则进行创建
    if(!depsMap){
        bucket.set(target,(depsMap = new Map()))
    } 

    // 再拿到对应的effect集合
    let deps = depsMap.get(key)

    if(!deps){
        depsMap.set(key,(deps = new Set()))
    }

    // 添加进去
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}

// 事件派发
let trigger = (target,key)=>{
    // console.log('trigger',key)
    let depsMap = bucket.get(target)

    if(!depsMap) return ;

    let effects = depsMap.get(key)
    
    const effectsToRun = new Set()

    // 避免那些同时进行get和set的操作造成的死循环
    // 避免死循环，如果活动函数与当前函数和一样，则不需要执行
    effects && effects.forEach((effect)=>{
        if(activeEffect !== effect){
            effectsToRun.add(effect)
        }
    })
    effectsToRun.forEach(fn=>{
        // 如果有传进来的调度器，则执行用户给的，否则执行默认的
        if(fn.options.scheduler){
            fn.options.scheduler(fn)
        }else{
            fn()
        }
    })
}

// 清除函数：用来进行分支切换
// 比如遇到三目运算符 temp = appData.ok? appData.text : appData.name
// 如果appData.ok为true时，temp依赖的属性有ok和text，两者发生改变时应该改变
// 但是此时由于appData.ok的属性改变了，依赖就变成了ok和name，此时就形成的分支切换
// 此时按我们的需求讲，只需要name的值改变时，temp才变化，但是实际上却是，text的值发送改变，temp也会改变
// 所以就需要解决这个问题
// 方案：每一次收集副作用时，将与之关联的集合的切断联系
// 实施：给每个作用函数定义一个数组进行收集，让key与effect形成相互关联的联系
// 所以此时每次进行作用收集的时候，都会先删除之前所关联的副作用函数
let cleanup = (effectfn)=>{
    for(let i = 0; i < effectfn.deps.length; i ++){
        let deps = effectfn.deps[i];
        deps.delete(effectfn)
    }
    effectfn.deps.length = 0
}

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
            if(dirty){
                value = effectfn()
                dirty = false
            }
            track(obj,'value')
            return value
        }     
    }
    return obj
}

export  {effect,reactive,computed}

