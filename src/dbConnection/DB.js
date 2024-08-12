import mongoose from "mongoose";

export  const dbConnection = () => {
  mongoose
    .connect(process.env.DBCONNECTION)
    .then(() => {
      console.log("data base is connection");
    })
    .catch((err) => {
      console.log(`Error :${err} `);
    });
};
 
