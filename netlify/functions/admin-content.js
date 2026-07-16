const { json, isAuthed, github, repoConfig } = require("./_common");
const FILE="/contents/content/site.json";
exports.handler = async (event) => {
  if (!isAuthed(event)) return json(401,{error:"로그인이 필요합니다."});
  try {
    const c=repoConfig();
    if(event.httpMethod==="GET"){
      const f=await github(`${FILE}?ref=${encodeURIComponent(c.branch)}`);
      const content=JSON.parse(Buffer.from(f.content,"base64").toString("utf8"));
      return json(200,{content,sha:f.sha});
    }
    if(event.httpMethod==="PUT"){
      const body=JSON.parse(event.body||"{}");
      if(!body.content || typeof body.content!=="object") return json(400,{error:"저장할 내용이 없습니다."});
      const current=await github(`${FILE}?ref=${encodeURIComponent(c.branch)}`);
      const encoded=Buffer.from(JSON.stringify(body.content,null,2)+"\n","utf8").toString("base64");
      await github(FILE,{method:"PUT",body:JSON.stringify({
        message:"관리자 페이지에서 홈페이지 설정 수정",
        content:encoded,sha:current.sha,branch:c.branch
      })});
      return json(200,{ok:true});
    }
    return json(405,{error:"허용되지 않은 요청입니다."});
  } catch(e){ return json(500,{error:e.message}); }
};
