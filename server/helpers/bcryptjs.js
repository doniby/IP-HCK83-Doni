import { genSaltSync, hashSync, compareSync } from "bcryptjs";
require("dotenv").config();

const hashPassword = (plainPassword) => {
  const salt = genSaltSync(10);
  return hashSync(plainPassword, salt);
};

const comparePassword = (plainPassword, hashedPassword) => {
  return compareSync(plainPassword, hashedPassword);
};

export { hashPassword, comparePassword };