const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

const hasEmptyFields = (body, error_list) => {
  for (field in body) {
    if (!body[field]) {
      error_list[field] = `${field} is required`;
    }
  }
  if (Object.keys(error_list).length > 0) {
    return true;
  }
  return false;
};

// register
exports.register = async (req, res) => {
  const { first_name, last_name, email, password, confirm_password } = req.body;

  let error_list = {};
  // error_list.first_name = first_name ? "" : "First Name is required";

  if (hasEmptyFields(req.body, error_list)) {
    res.status(400);
    return res.json(error_list);
  }

  if (password !== confirm_password) {
    error_list.confirm_password =
      "Password and Confirm Password does not match!";
    return res.status(400).json(error_list);
  }

  const hashpassword = await bcrypt.hash(password, 10);

  db.query(`SELECT * FROM users WHERE email = ?`, email, (err, result) => {
    if (err) {
      console.log(err.message);
      res.send(err);
    }

    if (result.length > 0) {
      error_list.email = "Email is already in use.";
      return res.status(400).json(error_list);
    }

    db.query(
      "INSERT INTO users SET ?",
      {
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: hashpassword,
      },
      (err) => {
        if (err) {
          return console.log(err.message);
        }
        console.log("Registration sucessful");
        res.send("Success");
      }
    );
  });
};

// login
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    `SELECT * FROM users
        WHERE email = ?`,
    email,
    async (err, result) => {
      if (err) {
        return console.log(err);
      }
      if (
        !result.length ||
        !(await bcrypt.compare(password, result[0].password))
      ) {
        console.log(result);
        return res
          .status(401)
          .json({ message: "Email or Password is Incorrect" });
      }
      return res.status(200).json(result[0]);
    }
  );
};

exports.fetch = (req, res) => {
  db.query(`SELECT * FROM users`, (err, result) => {
    if (err) {
      return console.log(err.message);
    }
    return res.status(200).json(result);
  });
};

exports.getUser = (req, res) => {
  const id = req.params.id;
  db.query(`Select * FROM users WHERE user_id = ?`, id, (err, result) => {
    if (err) {
      return console.log(err.message);
    }
    return res.status(200).json(result);
  });
};

// EDIT / UPDATE
exports.update = (req, res) => {
  const id = req.params.id;
  const { first_name, last_name } = req.body;
  db.query(
    `UPDATE users
SET first_name = ?, last_name = ?
WHERE user_id = ?`,
    [first_name, last_name, id],
    (err) => {
      if (err) {
        return console.log(err.message);
      }

      return res.status(200).json({ message: "User updated successfully" });
    }
  );
};

// DELETE
exports.delete = (req, res) => {
  const id = req.params.id;

  db.query(`DELETE FROM users WHERE user_id = ?`, id, (err, result) => {
    if (err) {
      return console.log(err.message);
    }
    console.log(`Deleted user_id ${id}`);
    return res.json({ message: "Deleted Successfully" });
  });
};
