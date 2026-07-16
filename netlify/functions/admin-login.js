const { TTL, env, json, sign, sessionCookie, safeEqual } = require("./_common");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405,{error:"허용되지 않은 요청입니다."});
  try {
    const {password=""} = JSON.parse(event.body||"{}");
    if (!safeEqual(password, env("ADMIN_PASSWORD"))) return json(401,{error:"비밀번호가 맞지 않습니다."});
    const token = sign({role:"admin",exp:Math.floor(Date.now()/1000)+TTL});
    return json(200,{ok:true},{"Set-Cookie":sessionCookie(token)});
  } catch (e) { return json(500,{error:"관리자 설정을 확인해주세요."}); }
};
