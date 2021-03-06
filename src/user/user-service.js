const bcrypt = require("bcryptjs");
const xss = require("xss");

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  hasUserWithUserName(db, username) {
    return db("travelist_users")
      .where({ username })
      .first()
      .then(user => !!user);
  },
  getByUserName(db, username) {
    return db
      .select(
        "usr.id",
        "usr.fullname",
        "usr.username",
        "usr.password",
        "usr.profile",
        "usr.image_url"
      )
      .from("travelist_users as usr")
      .where("usr.username", username)
      .first();
  },
  getById(db, id) {
    return db
      .select(
        "usr.id",
        "usr.fullname",
        "usr.username",
        "usr.password",
        "usr.profile",
        "usr.image_url"
      )
      .from("travelist_users as usr")
      .where("usr.id", id)
      .first();
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into("travelist_users")
      .returning("*")
      .then(([user]) => {
        console.log("insert user into db" + user);
        return user;
      });
  },
  updateUser(db, id, newUserFields) {
    return db
      .from("travelist_users")
      .where({ id })
      .update(newUserFields);
  },
  validatePassword(password) {
    if (password.length < 8) {
      return "Password must be longer than 8 characters";
    }
    if (password.length > 72) {
      return "Password must be less than 72 characters";
    }
    if (password.startsWith(" ") || password.endsWith(" ")) {
      return "Password must not start or end with empty space";
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return "Password must contain one uppercase, lowercase, number and special character";
    }
    return null;
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  serializeUser(user) {
    return {
      id: user.id,
      image_url: xss(user.image_url),
      profile: xss(user.profile),
      fullname: xss(user.fullname),
      username: xss(user.username),
      email: xss(user.email)
    };
  }
};

module.exports = UsersService;
