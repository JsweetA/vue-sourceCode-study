import {reactive,effect,computed} from "./reactive.js"
let app = document.getElementById('app')
let btn = document.getElementById('btn')
let temp1 , temp2

const appData = reactive({
    firstName:"黄",
    ok:true,
    lastName:"院"
})

// 计算属性
const computedData = computed(()=>{
    return appData.firstName + appData.lastName
})
btn.addEventListener('click',()=>{
    appData.firstName += 'a'
    // console.log(computedData.value)
})


// 有个bug，应该是嵌套问题
effect(()=>{
    app.innerHTML = computedData.value
})

// 嵌套effect
// effect(()=>{
//     temp1 = appData.text
//     effect(()=>{
//         temp2 = appData.name
//         app.innerText = temp2 + temp1   
//     })
// })
// 调度器，将执行方式交给用户
// effect(
//     ()=>{ 
//         app.innerText = appData.ok ? appData.text : appData.name 
//     }
//     ,
//     {
//     scheduler(fn){
//         setTimeout(fn,2000)
//     }
// })
// lazy,懒执行
// const e = effect(()=>{
//     app.innerText = appData.ok ? appData.text : appData.name 
// },{lazy:true})