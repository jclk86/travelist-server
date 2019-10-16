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
  getById(db, id) {
    return db
      .select("usr.id", "usr.username", "usr.password", "usr.profile")
      .from("travelist_users as usr")
      .where("usr.id", id)
      .first();
  },
  insertUser(db, newUser) {
    return db
      .insert(newUser)
      .into("travelist_users")
      .return("*")
      .then(([user]) => user);
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
      return "Password must contain one upper case, lower case, number and special character";
    }
    return null;
  },
  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },
  serializeUser(user) {
    return {
      id: user.id,
      profile: xss(user.profile),
      fullname: xss(user.fullname),
      username: xss(user.username),
      password: xss(user.password),
      email: xss(user.email),
      date_created: new Date(user.date_created)
    };
  }
};

module.exports = UsersService;
