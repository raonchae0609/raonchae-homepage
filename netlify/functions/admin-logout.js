const { json, sessionCookie } = require("./_common");
exports.handler = async () => json(200,{ok:true},{"Set-Cookie":sessionCookie("",0)});
