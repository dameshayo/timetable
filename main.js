const express=require("express")

const app=express()

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use("/app/api",require("./service/route"))

app.listen(4000,function(){
  console.log("sever running in port: 2000" );
})