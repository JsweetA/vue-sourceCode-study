import {reactive,effect} from "./reactive.js"

let app = document.getElementById('app')
let btn = document.getElementById('btn')

let temp1 , temp2
const appData = reactive({
    text:123,
    ok:true,
    name:"hy"
})
const appData2 = reactive({text:1})


effect(()=>{
    app.innerText = appData.ok ? appData.text : appData.name 
})
btn.addEventListener('click',()=>{
    appData.ok = !appData.ok
})

// 嵌套effect
// effect(()=>{
//     temp1 = appData.text
//     effect(()=>{
//         temp2 = appData.name
//         app.innerText = temp2 + temp1   
//     })
// })