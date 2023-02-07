import {reactive,effect} from "./reactive.js"

let app = document.getElementById('app')
let btn = document.getElementById('btn')

let temp1 , temp2
const appData = reactive({
    text:123,
    name:"hy"
})
const appData2 = reactive({text:1})
effect(()=>{
    console.log(1)
    temp1 = appData.text
    effect(()=>{
        console.log(2)
        temp2 = appData.name
        app.innerText = temp2 + temp1   
    })
})

btn.addEventListener('click',()=>{
    appData.text += 1
})