const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors({
  origin: [
    'http://localhost:5173' 
  'https://cars-doctor-795ed.web.app',
  'https://cars-doctor-795ed.firebaseapp.com'
  ],
  credentials: true
}))
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@cluster0.i96dagf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// medilware

const logger = (req, res, next) => {
  console.log('log: info', req.methode, req.url);
  next()
}

const varifyToken = (req, res, next) => {
  const token = req?.cookies.token;
  console.log('token in the middleware', token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized accsess' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decode;
    next()
  })
  
}

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
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          recure: false,
          sameSite: 'none'
        })
        .send({ success: true })
    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log('login out', user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })

    app.get('/servises', async (req, res) => {
      const cursor = serviceCollection.find()
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/servises/:id', async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) }

      const options = {
        // Include only the `title` and `imdb` fields in the returned document
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(quary, options)
      res.send(result)
    })

    // chackingOut 

    app.get('/chackout',  async (req, res) => {
      console.log(req.query.user);
      console.log('cook cook cookies', req.cookies);
      let query = {}
      if (req.query?.user) {
        query = { user: req.query.user }
      }
      const result = await chackOutCollection.find(query).toArray();
      res.send(result)

    })

    app.post('/chackout', async (req, res) => {
      const chackout = req.body;
      console.log(chackout);
      const result = await chackOutCollection.insertOne(chackout)
      res.send(result)

    })

    app.patch('/chackout/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updated = req.body;
      console.log(updated);
      const updateDoc = {
        $set: {
          status: updated.status
        }
      }
      const result = await chackOutCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete('/chackout/:id', async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) }
      const result = await chackOutCollection.deleteOne(quary);
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
app.listen(port, () => {
  console.log(`car doctor server is running on ${port}`);
})