const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("config");

// Socket.io setup
const socketio = require("socket.io");
const http = require("http").Server(app);
const socket = socketio(http);
const socketEvents = require("./chats/socket");

const businesses = require("./routes/businesses");
const founders = require("./routes/founders");
const auth = require("./routes/auth");
const search = require("./routes/search");
const chat = require("./routes/chats");

// Middleware
app.use(cors());
app.options("*", cors());

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtprivatekey is not defined");
  process.exit(1);
}

new socketEvents(socket).socketConfig();

mongoose.set("useCreateIndex", true);
mongoose.set("useFindAndModify", false);

mongoose
  .connect("mongodb://admin:chatadmin1@ds129706.mlab.com:29706/chats", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error("Could not connect to MongoDB..."));

app.use(express.json());
app.use("/businesses", businesses);
app.use("/founders", founders);
app.use("/auth", auth);
app.use("/search", search);
app.use("/chat", chat);
// PORT
const PORT = process.env.PORT || 3001;
http.listen(PORT, () => console.log(`Listening on port ${PORT}....`));
