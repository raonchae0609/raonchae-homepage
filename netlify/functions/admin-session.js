const { json, isAuthed } = require("./_common");
exports.handler = async (event) => json(200,{authenticated:isAuthed(event)});
