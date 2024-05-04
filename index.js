const express = require('express');
const cors = require('cors');
const jwt = require ('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.i96dagf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db('carDoctor').collection('servises')
    const chackOutCollection = client.db('carDoctor').collection('chackout')

    // jwt

    app.post('/jwt', async (req, res) => {
      const user = req.body;
       console.log(user);
       const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn:'1h'})
       res
       .cookie('token', token,{
        httpOnly: true, 
        recure: false, 
        sameSite: 'none'
       })
      .send({success: true})
    })

    app.get('/servises', async(req, res)=> {
        const cursor = serviceCollection.find()
        const result = await cursor.toArray();
        res.send(result)
    })

    app.get('/servises/:id', async (req, res) => {
        const id = req.params.id;
        const quary = { _id: new ObjectId(id)}

        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title:1, price:1, service_id:1, img:1 },
          };

        const result = await serviceCollection.findOne(quary, options)
        res.send(result)
    })

    // chackingOut 

    app.get('/chackout', async(req, res)=> {
      console.log(req.query.email);
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await chackOutCollection.find(query).toArray();
      res.send(result)

  })

    app.post('/chackout', async(req, res)=> {
        const chackout = req.body;
        console.log(chackout);
        const result = await chackOutCollection.insertOne(chackout)
        res.send(result)

    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('doctor is running')
})
app.listen(port, ()=> {
console.log(`car doctor server is running on ${port}` );
})