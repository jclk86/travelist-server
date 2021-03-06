const express = require("express");
const UsersService = require("./user-service");
const userRouter = express.Router();
const bodyParser = express.json();
const { requireAuth } = require("../middleware/jwt-auth");
const path = require("path");

userRouter.post("/", bodyParser, (req, res, next) => {
  const { username, password, email, fullname, image_url, profile } = req.body;

  for (const field of ["username", "profile", "password", "email", "fullname"])
    if (!req.body[field])
      return res
        .status(400)
        .json({ error: `Missing '${field}' in request body` });

  const passwordError = UsersService.validatePassword(password);

  if (passwordError) return res.status(400).json({ error: passwordError });

  UsersService.hasUserWithUserName(req.app.get("db"), username)
    .then(hasUserWithUserName => {
      if (hasUserWithUserName) {
        return res.status(400).json({ error: `Username already taken` });
      }
      // encypts password
      return UsersService.hashPassword(password).then(hashedPassword => {
        const newUser = {
          username,
          profile,
          image_url,
          password: hashedPassword,
          fullname,
          email
        };
        return UsersService.insertUser(req.app.get("db"), newUser).then(
          user => {
            res
              .status(201)
              .location(
                path.posix.join(
                  req.originalUrl,
                  `/profile/${newUser.username.replace(/ /g, "")}`
                )
              )
              .json(UsersService.serializeUser(user));
          }
        );
      });
    })
    .catch(next);
});

userRouter
  .route("/account")
  .all(requireAuth)
  .all(checkUserExists)
  .get((req, res, next) => {
    res.json(UsersService.serializeUser(req.user));
  })
  .patch(bodyParser, (req, res, next) => {
    const { password, profile, image_url } = req.body;

    for (const field of ["password", "profile", "image_url"])
      if (!req.body[field])
        return res
          .status(400)
          .json({ error: `Missing '${field}' in request body` });

    const passwordError = UsersService.validatePassword(password);

    if (passwordError) return res.status(400).json({ error: passwordError });

    UsersService.hashPassword(password).then(hashedPassword => {
      const updatedUser = {
        image_url,
        password: hashedPassword,
        profile
      };
      return UsersService.updateUser(
        req.app.get("db"),
        res.user.id,
        updatedUser
      )
        .then(user => {
          res
            .status(201)
            .location(path.posix.join(req.originalUrl))
            .json(UsersService.serializeUser(user));
        })
        .catch(next);
    });
  });

userRouter
  .route("/profile/:username")
  .all(checkProfileExists)
  .get((req, res, next) => {
    res.json(UsersService.serializeUser(res.user));
  });

// below async functions pass on objects to be used in routes above.
async function checkProfileExists(req, res, next) {
  try {
    const user = await UsersService.getByUserName(
      req.app.get("db"),
      req.params.username
    );
    if (!user)
      return res.status(404).json({
        error: `Profile doesn't exist`
      });
    res.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function checkUserExists(req, res, next) {
  try {
    const user = await UsersService.getById(req.app.get("db"), req.user.id);
    if (!user)
      return res.status(404).json({
        error: `User doesn't exist`
      });
    res.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = userRouter;
