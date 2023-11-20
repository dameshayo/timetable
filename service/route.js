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
                            //    console.log(sessionArray);
                            
                                sessionArray[0]=sessionArray[0];
                                sessionArray[1]=sessionArray[1];
                              
                                sessionArray[3]=[[sessionArray[3],sessionArray[2]],[sessionArray[sessionArray.length-1],sessionArray[5]]];
                                sessionArray[5]=sessionArray[4];
                                sessionArray[4]=sessionArray[sessionArray.length-2];
                                sessionArray[4]="Lecture";
                                sessionArray[2]="";
                               
                               
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
                       let obj={[`${day}`]:sessions};
                   
                       json.push(obj);
                   }
              
                }

                const description=$("table:not(.table) tbody tr");
                const descriptions=[];
                for(let desc=0;desc<description.length;desc++){
                    let td=$(description[desc]);
                    let course=$(td.find("td")[1]).text();
                    let descript=$(td.find("td")[2]).text();
                    const obj2={
                        course:course,
                        description:descript
                    }
                    descriptions.push(obj2);
                }
              
                res.json({"msg":"success","programme":title.replaceAll(/\\/g,""),"data":json,"descriptions":descriptions});
            }).catch((error) => {
                res.json({"msg":"fail to load table"});
                console.error({ error });
              });;
         } catch (error) {
            res.json({"msg":"fail to load table"});
             console.log(error)
         }

       
});

router.get("get_semesters/semesters/:year",(req,res)=>{
    year=req.params.year;
    try {
        axios.get(`https://ratiba.udom.ac.tz/index.php/downloads/fetch-semesters?_csrf-backend=zB-cS_yxG2p4CUZwu1IvGMzP4Efn1rOqXtr2TAOdI1a5TKQJjMVXIj9-D0D8NFh8lY6hGLGAi-Jtl8UJcPtFDA%3D%3D&year=${year}&semester=&type=&option=&data%5B%5D=`).then((semesters)=>{
            const $=cheerio.load(semesters.data);
            text=$($("option")[1]).val()

           console.log(text)
           res.json({"status":true,"msg":"Success","value":text})
        });
    } catch (error) {
        res.json({"status":false,"msg":"fail to load semesters"})
        console.log("An error occurred yap")
    }
})
router.get("/programmes/:year/:semester",(req,res)=>{
    year=req.params.year;
    semester=req.params.semester;
    try{
      axios.get(`
      https://ratiba.udom.ac.tz/index.php/downloads/data?_csrf-backend=zB-cS_yxG2p4CUZwu1IvGMzP4Efn1rOqXtr2TAOdI1a5TKQJjMVXIj9-D0D8NFh8lY6hGLGAi-Jtl8UJcPtFDA%3D%3D&year=${year}&semester=${semester}&type=1&option=programme&data%5B%5D=`).then((programmes)=>{
        const $=cheerio.load(programmes.data);
        const converted=$("select").find("option").map((index, element)=> {
           
           return {"name":String($(element).text().split("-")[0]).trim(),"value":$(element).val(),"college":String($(element).text().split("-")[1]).trim(),"year":String($(element).text().split("-")[0]).trim().charAt(String($(element).text().split("-")[0]).trim().length-1)}
        
        }).get()
        res.json({"status":true,"message":"Success load programmes","programmes":converted.filter((item)=>item.value!="")})
      });
    }
    catch (error){
        res.json({"status":false,"message":"fail to load programmes","programmes":null})
    }
})


module.exports=router;
