const express = require("express");
const AuthService = require("./auth-service");
const bodyParser = express.json();
const authRouter = express.Router();
const { requireAuth } = require("../middleware/jwt-auth");

authRouter.post("/login", bodyParser, (req, res, next) => {
  const { username, password } = req.body;
  const loginUser = { username, password };

  for (const [key, value] of Object.entries(loginUser))
    if (value == "")
      return res.status(400).json({
        error: `Missing '${key}' in request body`
      });

  AuthService.getUserWithUserName(req.app.get("db"), loginUser.username)
    .then(dbUser => {
      if (!dbUser)
        return res.status(400).json({
          error: "Incorrect username or password"
        });

      return AuthService.comparePasswords(
        loginUser.password,
        dbUser.password
      ).then(compareMatch => {
        if (!compareMatch)
          return res.status(400).json({
            error: "Incorrect username or password"
          });
        const sub = dbUser.username;
        const payload = { user_id: dbUser.id };
        res.send({ authToken: AuthService.createJwt(sub, payload) });
      });
    })
    .catch(next);
});
// payload user id is used in the front end for not only login, but also
// to allow for certain options to be available to users working under their
// account.
authRouter.post("/refresh", requireAuth, (req, res, next) => {
  const sub = req.user.username;
  const payload = { user_id: req.user.id };
  res.send({ authToken: AuthService.createJwt(sub, payload) });
});

module.exports = authRouter;
