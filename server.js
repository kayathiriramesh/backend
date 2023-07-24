const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const bcrypt = require ("bcrypt");
app.use(express.json());
const  jwt  =  require("jsonwebtoken");
const SECRET="hospitalloginregisterlist";

const cors=require("cors");
app.use(cors());

const {Client} = require('pg')
const client = new Client ({
    user:"postgres",
    password:"12345678",
    host:"localhost",
    port:"5432",
    database:"Hospital"
})
client.connect()


const authorize = (req,res,next) => {
    if (req.headers.authorization){
       try {
           let token=req.headers.authorization.split(" ")[1];
           const verify= jwt.verify(token,'hospitalloginregisterlist');
               if(verify){
                   next();
               }
       }catch (error){
           res.status(401).json({message:"Unauthorized"});
       }
   }else{
       res.status(401).json({message:"Unauthorized"});
   }
}

//REGISTER code

app.post("/register",async(req,res) =>{
    const { username, email, password } =  req.body;
    try {
        const  data  =  await client.query(`SELECT * FROM loginregister WHERE email= $1;`, [email]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  !=  0) {
        return  res.status(400).json({
        error: "Email already there, No need to register again.",}); }
        else{ 
        const salt= await bcrypt.genSalt(10)
        const hash= await bcrypt.hash(req.body.password,salt)
        console.log(hash)
        const  user  = {
            username,
            email,
            password: hash,};
        client
        .query(`INSERT INTO loginregister (username, email, password) VALUES ($1,$2,$3);`, 
            [user.username, user.email, user.password], (err) => { 
            if (err) {
            console.error(err);
            return  res.status(500).json({
            error: "Database error"
            })}
            else {
            res.status(200).send({ message: 'message:"user inserted' }); }}); }}
    catch(error){
            console.log(error);
            res.status(500).json({message:"Something went wrong"});};});

    // LOGIN CODE
             
    app.post("/login",async(req,res) =>{
    const { email, password } = req.body;
    try{
        const data = await client.query(`SELECT * FROM loginregister WHERE email= $1;`, [email]) //Verifying if the user exists in the database
        const user = data.rows;
        if (user.length === 0) {
        res.status(400).json({
        error: "User is not registered, Sign Up first",
        });}
        else {
            bcrypt.compare(password, user[0].password, (err, result) =>  //Comparing the hashed password
            {if (err) {
            res.status(500).json({
            error: "Server error",
            });
            } else if (result === true) 
            { //Checking if credentials match
                const token = jwt.sign({id:user._id},SECRET,{expiresIn: "1h"})
                console.log(token);
                res.json({message:"login success",token});
            }
            else{
                res.json({message:"Email/Password is Wrong"})
            }
        }) ;}
    } catch(error){
        console.log(error);
        res.status(500).json({message:"Something went wrong"})
    }           
    
});

//INSERT paticent

app.post("/paticent",authorize,async(req,res) =>{
    const { paticent_id,registered_date,paticent_name,diseas,phone_no,doctor_name } =  req.body;
    try {
        const  data  =  await client.query(`SELECT * FROM paticentlist WHERE paticent_id= $1;`, [paticent_id]); //Checking if user already exists
        const  arr  =  data.rows;
        if (arr.length  !=  0) {
        return  res.status(400).json({
        error: "paticent_id already there, No need to register again.",}); }
        else{ 
        const  user  = {
            paticent_id,
            registered_date,
            paticent_name,
            diseas,
            phone_no,
            doctor_name
            };
        client
        .query(`INSERT INTO paticentlist ( paticent_id,registered_date,paticent_name,diseas,phone_no,doctor_name) VALUES ($1,$2,$3,$4,$5,$6);`, 
            [user.paticent_id, user.registered_date, user.paticent_name,user.diseas,user.phone_no,user.doctor_name], (err) => { 
            if (err) {
            console.error(err);
            return  res.status(500).json({
            error: "Database error"
            })}
            else {
            res.status(200).send({ message: 'message:"paticent inserted' }); }}); }}
    catch(error){
            console.log(error);
            res.status(500).json({message:"Something went wrong"});};   
});

  //GET all paticents details

app.get("/paticents", authorize,async(req,res)=> 
  {
   try{
    const data = await client.query(`SELECT * FROM paticentlist ORDER BY  paticent_id ASC`) 
    //console.log(data);
    const  arr  =  data;
        if (arr.length  ==  0) {
        return  res.status(400).json({
        error: "No one in this list.",}); }
        else{
            res.status(200).json(arr.rows)
        }

   }catch(error){
    console.log(error);
    res.status(500).json({message:"Something went wrong"})
}    
  });

  app.get("/paticent/:id", authorize,async(req,res)=> 
  {
    const paticent_id= parseInt(req.params.id)
   try{
    const data = await client.query(`SELECT * FROM paticentlist WHERE  paticent_id= $1`,[paticent_id])
    //console.log(data);
    const  arr  =  data;
        if (arr.length  ==  0) {
        return  res.status(400).json({
        error: "No one in this list.",}); }
        else{
            res.status(200).json(arr.rows)
        }

   }catch(error){
    console.log(error);
    res.status(500).json({message:"Something went wrong"})
}    
  });

  //UPDARE one paticent details

  app.put("/paticent/:id",authorize,async (req,res) =>{
    const paticent_id= parseInt(req.params.id)
    const { registered_date,paticent_name,diseas,phone_no,doctor_name } =  req.body;
    //console.log(req.params.id);
    try{
        const data = await client.query(`UPDATE paticentlist  SET registered_date=$1,paticent_name=$2,diseas=$3,phone_no=$4,doctor_name=$5 WHERE paticent_id=$6`,[registered_date,paticent_name,diseas,phone_no,doctor_name,paticent_id])
        res.status(200).json({message:`USER updated with ${ paticent_id}`})

    }catch(error){
        console.log("error",error);
        res.status(500).json({message:"Something went wrong"})
    }
  });

  // DELETE one paticent details

  app.delete("/paticent/:id",authorize,async (req,res) =>{
    const paticent_id= parseInt(req.params.id)
    //console.log(req.params.id);
    try{
        const data = await client.query(`DELETE FROM paticentlist WHERE paticent_id= $1`,[paticent_id]) 
        res.status(200).json({message:`USER delected with ${ paticent_id}`})

    }catch(error){
        console.log("error",error);
        res.status(500).json({message:"Something went wrong"})
    }
  });

const PORT= process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
