function asdf(p,cb){
    var npx = p+12
    if(typeof cb==="function"){
        cb(npx)
        return
    }
    return new Promise((resolve, reject) => {
        resolve(npx);
    })
    
    
}
asdf(12,(res)=>{
    console.log(res);
})