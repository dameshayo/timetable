const express=require("express");
const router=express.Router();
const axios=require("axios")
const cheerio=require("cheerio")
function containsNumbers(str) {
    return /\d/.test(str);
  }
router.get("/:type/:programme",(req,res)=>{
    let type=req.params.type;
    let programe=req.params.programme;
        const json=[];
         try {
            axios.get(`https://ratiba.udom.ac.tz/index.php/downloads/view?_csrf-backend=80ueMJpmytnu8E8p1kHI_xWXxsqsi0J9Ka_ISYhOFHOgI9lvxV-6vN_dLGv7BLuYVqaZ-57dBFBKyqAY4g1NPw%3D%3D&year=9&semester=3352&type=${type}&option=programme&data=${programe}`).then((timetable)=>{
                // console.log(timetable);
              
                const $=cheerio.load(timetable.data);
                const title=$("h4").text().split("-")[0];

                const table=$(".table");
            
                console.log(table.find("tbody tr").length);
              for(let row=0;row<table.find("tbody tr").length;row++){
                   const day=$($(table.find("tbody tr")[row]).find("td")[0]).text();
                   
                   if(!containsNumbers(day)){
                    const sessions=[];
                    for(let column=0;column<table.find("tbody tr td").length;column++){
                        if($($(table.find("tbody tr")[row]).find("td")[column+1]).text().replaceAll(/\s/g,'')!==""){
                            const session=$($(table.find("tbody tr")[row]).find("td")[column+1]).text().replaceAll(/\s/g,'');
                            let sessionArray=Array.from(session.split(";"))
                            const time=sessionArray[0].split(",")[0];
                            const sessionType=sessionArray[0].split(",")[1].split("-")[1];
                            const course=sessionArray[0].split(",")[1].split("day")[1].split("-")[0];
                            sessionArray[0]=time;
                            sessionArray=sessionArray.map((value)=>{
                                if(value.includes("Staff")){
                                     return value.split(":")[1];
                                }
                                else if(value.includes("Students")){
                                    return value.split(":")[1];
                                }
                                else if(value.includes("Venue")){
                                    return value.split(":")[1];
                                }
                                else{
                                    return value;
                                }
                            });
            
                            if(sessionArray.length>6){
                                sessionArray[0]=sessionArray[0];
                                sessionArray[1]=sessionArray[1];
                              
                                sessionArray[3]=[[sessionArray[3],sessionArray[2]],[sessionArray[sessionArray.length-1],sessionArray[5]]];
                                sessionArray[5]=sessionArray[4];
                                sessionArray[4]=sessionArray[sessionArray.length-2];
                                sessionArray[4]="Lecture";
                                sessionArray[2]="";
                               
                                // console.log(sessionArray);
                            }
                            // sessionArray[1]=sessionArray[1].split(":")[1];
                            // sessionArray[2]=sessionArray[2].split(":")[1];
                            // sessionArray[3]=sessionArray[3].split(":")[1];
                            sessionArray.push(sessionType);
                            sessionArray.push(course);
                            sessionArray.length=6;
                            
                            //create object
                            const json2={
                                time:sessionArray[0],
                                lecturer:sessionArray[1],
                                program:sessionArray[2],
                                venue:sessionArray[3],
                                sessionType:sessionArray[4],
                                course:sessionArray[5],
                            }
                            sessions.push(json2);
                        }
                       }
                       let obj={[`${day.replace(/\\/g, "")}`]:sessions};
                   
                       json.push(obj);
                   }
              
                }
                res.json({"msg":"success","programme":title.replaceAll(/\\/g,""),"data":json});
            }).catch((error) => {
                res.json({"msg":"fail to load table"});
                console.error({ error });
              });;
         } catch (error) {
            res.json({"msg":"fail to load table"});
             console.log(error)
         }

     
       
    
   
    
});

module.exports=router;
