import { track,trigger } from "./effect.js"

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

export default reactive
