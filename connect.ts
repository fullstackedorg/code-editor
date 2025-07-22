import { connect } from "connect";

const channel = await connect("langchain", 8888);
channel.on(console.log);

console.log("connected");