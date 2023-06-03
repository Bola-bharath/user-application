const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log("DB Error");
  }
};
initializeDB();
//registerApi
app.post("/register/", async (request, response) => {
  const userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUsername = `select * from user where username = '${username}';`;
  const dbUser = await db.get(selectUsername);
  if (dbUser === undefined) {
    const createUser = `
        insert into user(username,name,password,gender,location) values ('${username}',
        '${name}','${hashedPassword}','${gender}','${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await db.run(createUser);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//loginApi
app.post("/login/", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const selectUsername = `
   select * from user where username = '${username}';`;
  const dbUser = await db.get(selectUsername);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//updatePasswordApi
app.put("/change-password/", async (request, response) => {
  const requestDetails = request.body;
  const { username, oldPassword, newPassword } = requestDetails;
  const selectUserQuery = `
   select * from user where username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashNewPass = await bcrypt.hash(newPassword, 10);
        const updatePassQuery = `
               update user set password = '${hashNewPass}' where username = '${username}';`;
        await db.run(updatePassQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
