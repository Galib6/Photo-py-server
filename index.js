const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config()
const app = express();
const port = process.env.PROT || 5000;

// middlewere
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wjuepub.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        const serviceCollection = client.db("photography").collection("services");
        const reviewCollection = client.db("photography").collection("review");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })

        app.get('/threeServices', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).limit(3).toArray()
            res.send(services);
        });

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).toArray()
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        app.post('/services', async (req, res) => {
            const order = req.body;
            const result = await serviceCollection.insertOne(order);
            res.send(result);
        });
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { serviceId: id }
            const cursor = reviewCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).toArray()
            res.send(services);
        });
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.get('/myreviews', verifyJWT, async (req, res) => {
            const query = { email: req.query.email }
            const cursor = reviewCollection.find(query);
            const services = await cursor.sort({ _id: -1 }).toArray()
            res.send(services);
        });

        app.delete('/myreviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.put("/myreviews/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upsert: true }
            const updatedReview = {
                $set: {
                    serviceId: review.serviceId,
                    name: review.name,
                    email: review.email,
                    img: review.img,
                    title: review.title,
                    rating: review.rating,
                    details: review.details
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedReview, option)
            res.send(result);
        })


    }

    finally {

    }


}

run().catch(err => console.log(err))

console.log(process.env.DB_USER, process.env.DB_PASSWORD)




app.get('/', (req, res) => {
    res.send('Photopy Server is running')
})

app.listen(port, () => {
    console.log(`Photopy server running on ${port}`);
})