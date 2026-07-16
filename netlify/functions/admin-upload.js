const crypto=require("crypto");
const { json, isAuthed, github, repoConfig } = require("./_common");
const ALLOWED={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
exports.handler=async(event)=>{
  if(!isAuthed(event))return json(401,{error:"로그인이 필요합니다."});
  if(event.httpMethod!=="POST")return json(405,{error:"허용되지 않은 요청입니다."});
  try{
    const b=JSON.parse(event.body||"{}");
    const ext=ALLOWED[b.type];
    if(!ext||!b.data)return json(400,{error:"JPG, PNG, WEBP 사진만 업로드할 수 있습니다."});
    const buf=Buffer.from(b.data,"base64");
    if(buf.length>8*1024*1024)return json(400,{error:"사진은 8MB 이하만 가능합니다."});
    const stamp=new Date().toISOString().replace(/[-:.TZ]/g,"");
    const id=crypto.randomBytes(4).toString("hex");
    const path=`assets/uploads/${stamp}-${id}.${ext}`;
    const c=repoConfig();
    await github(`/contents/${path}`,{method:"PUT",body:JSON.stringify({
      message:`관리자 페이지에서 사진 업로드: ${path}`,
      content:buf.toString("base64"),branch:c.branch
    })});
    return json(200,{ok:true,path:"/"+path});
  }catch(e){return json(500,{error:e.message})}
};
