const express=require("express");
const router=express.Router();
const axios=require("axios")
const cheerio=require("cheerio")
function containsNumbers(str) {
    return /\d/.test(str);
  }

router.get("/:type/:programme/:semester/:year",(req,res)=>{
    let type=req.params.type;
    let programe=req.params.programme;
    let semester=req.params.semester;
    let year=req.params.year;
        const json=[];
         try {
            axios.get(`https://ratiba.udom.ac.tz/index.php/downloads/view?_csrf-backend=80ueMJpmytnu8E8p1kHI_xWXxsqsi0J9Ka_ISYhOFHOgI9lvxV-6vN_dLGv7BLuYVqaZ-57dBFBKyqAY4g1NPw%3D%3D&year=${year}&semester=${semester}&type=${type}&option=programme&data=${programe}`).then((timetable)=>{
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
                           
                           
            
                            if(sessionArray.length>6){
                            //    console.log(sessionArray);
                                console.log("session array",sessionArray)
                                const time1=sessionArray[0].split(",")[0];
                                const sessionType1=sessionArray[0].split(",")[1].split("-")[1];
                                const course1=sessionArray[0].split(",")[1].split("day")[1].split("-")[0];
                                const venueLines = sessionArray.filter((line)=>line.toLowerCase().startsWith('venue'));
                                const staffLines = sessionArray.filter((line)=>line.toLowerCase().startsWith('staff'));
                                const studentLines = sessionArray.filter((line)=>line.toLowerCase().startsWith('students'));
                                console.log("staffs ",staffLines.length," venues ",venueLines.length,"students ",studentLines.length)
                                venueLines.forEach((venue,index)=>{
                                     //create object
                                     
                                    if(venue.includes(",")){
                                        const time_half=venue.split(",")[0].split(":")[2];
                                        const venue_half=venue.split(",")[0].split(":")[1];
                                        const lastTwoCharacters = venue_half.slice(-2);
                                       
                                        const new_time= lastTwoCharacters+":"+time_half+":"+venue.split(",")[0].split(":")[3];
                                        const day_session_type=venue.split(",")[1]
                                        const day_course=day_session_type.split("-")[0]
                                        const session_type=day_session_type.split("-")[1]
                                        const _course=day_course.split("day")[1];
                                        const json2={
                                            time:new_time,
                                            lecturer:staffLines[venueLines.length-1].split(":")[1],
                                            program:studentLines[venueLines.length-1].split(":")[1],
                                            venue:venueLines[1].split(":")[1],
                                            sessionType:session_type,
                                            course:_course,
                                        }
                                        sessions.push(json2);
                                        console.log("this is session venue",venue)
                                    }else{
                                        const venue_half=venueLines[0].split(",")[0].split(":")[1];
                                        const new_venue= venue_half.slice(0,-2)
                                        const json2={
                                            time:time1,
                                            lecturer:staffLines[0].split(":")[1],
                                            program:studentLines[0].split(":")[1],
                                            venue:new_venue,
                                            sessionType:sessionType1,
                                            course:course1,
                                        }
                                        sessions.push(json2);
                                        console.log("this is not session venue",venue)  
                                    }
                                });
                                // sessionArray[0]=time1;
                                
                                    
                            }
                            else{
                                const time=sessionArray[0].split(",")[0];
                                const sessionType=sessionArray[0].split(",")[1].split("-")[1];
                                const course=sessionArray[0].split(",")[1].split("day")[1].split("-")[0];
                                // console.log(`session course ${course}`)
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
                            // sessionArray[1]=sessionArray[1].split(":")[1];
                            // sessionArray[2]=sessionArray[2].split(":")[1];
                            // sessionArray[3]=sessionArray[3].split(":")[1];
                          
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



router.get("/get_semesters/semesters/:year",(req,res)=>{
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
        const colleges=[];
        const converted=$("select").find("option").map((index, element)=> {
           if($(element).val()!=""){
                colleges.push(String($(element).text().split("-")[1]).trim())
            }
           return {"name":String($(element).text().split("-")[0]).trim(),"value":$(element).val(),"college":String($(element).text().split("-")[1]).trim(),"year":String($(element).text().split("-")[0]).trim().charAt(String($(element).text().split("-")[0]).trim().length-1)}
        
        }).get()
         const uniqueStringSet = new Set(colleges);

// Convert the Set back to an array (if needed)
         const uniqueStringList = [...uniqueStringSet];
        res.json({"status":true,"colleges":uniqueStringList,"message":"Success load programmes","programmes":converted.filter((item)=>item.value!="")})
      });
    }
    catch (error){
        res.json({"status":false,"message":"fail to load programmes","programmes":null})
    }
})

router.get("/instructors/:year/:semester",(req,res)=>{
    year=req.params.year;
    semester=req.params.semester;
  
    try{
      axios.get(`
      https://ratiba.udom.ac.tz/index.php/downloads/data?_csrf-backend=zB-cS_yxG2p4CUZwu1IvGMzP4Efn1rOqXtr2TAOdI1a5TKQJjMVXIj9-D0D8NFh8lY6hGLGAi-Jtl8UJcPtFDA%3D%3D&year=${year}&semester=${semester}&type=1&option=instructor&data%5B%5D=`).then((programmes)=>{
        const $=cheerio.load(programmes.data);
   
        const converted=$("select").find("option").map((index, element)=> {
          
           return {"name":String($(element).text().split("-")[0]).trim(),"value":$(element).val(),}
        
        }).get()
       
        res.json({"status":true,"message":"Success load instructors","instructors":converted.filter((item)=>item.value!="")})
      });
    }
    catch (error){
        res.json({"status":false,"message":"fail to load programmes","programmes":null})
    }
})

module.exports=router;
