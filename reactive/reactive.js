
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

let activeEffect = null
let activeEffectStack = []
// 存储响应式对象
let bucket = new WeakMap()

// 数据结构：
// weakmap ---- obj->key(map)
// map     ---- key->effect(set)

// 事件跟踪
let track = (target,key)=>{
    console.log('track')
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
    // console.log(activeEffect.deps)
    activeEffect.deps.push(deps)
}

// 事件派发
let trigger = (target,key)=>{
    console.log('trigger')
    let depsMap = bucket.get(target)

    if(!depsMap) return ;

    let effects = depsMap.get(key)
    
    const neweffects = new Set()
    effects && effects.forEach((effect)=>{
        if(activeEffect !== effect){
            neweffects.add(effect)
        }
    })
    neweffects.forEach(fn=>fn())
}

// 中介：
let effect = (fn)=>{
    function effectfn(){
        cleanup(effectfn)
        activeEffect = effectfn
        activeEffectStack.push(effect)
        fn()
        activeEffectStack.pop()
        activeEffect = activeEffectStack[activeEffectStack.length - 1]
    }
    // 收集哪些该与副作用函数相关联的依赖集合
    effectfn.deps = []
    effectfn()
}

// 清除函数
let cleanup = (effectfn)=>{
    for(let i = 0; i < effectfn.deps.length; i ++){
        let deps = effectfn.deps[i];
        console.log(deps,"deps")
        deps.delete(effectfn)
    }
    effectfn.deps.length = 0
}

export  {effect,reactive}

