require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c0tb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const userCollection = client.db('scholarDB').collection('users');
        const scholarCollection = client.db('scholarDB').collection('scholars');
        const appliedCollection = client.db('scholarDB').collection('applied');
        const reviewCollection = client.db('scholarDB').collection('reviews');
        const paymentCollection = client.db('scholarDB').collection('payments');


        // jwt api's
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '2h' });
            res.send({ token });
        });


        // middlewares
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorize access' });
            }

            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorize access' });
                }
                req.decoded = decoded;
                next();
            })
        };


        // user api's
        app.get('/users', verifyToken, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.get('/users/role/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            };

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            let moderator = false;
            if (user) {
                admin = user?.role === 'admin';
                moderator = user?.role === 'moderator';
            };
            res.send({ admin, moderator });

        });

        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user.email };
            const exitingUser = await userCollection.findOne(query);
            if (exitingUser) {
                return res.send({ massage: 'User already exists', insertedId: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.patch('/users/role/:id', async (req, res) => {
            const id = req.params.id;
            const { role } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });


        // scholar related api's
        app.get('/scholar', async (req, res) => {
            const result = await scholarCollection.find().toArray();
            res.send(result);
        });

        app.get('/scholar/top', async (req, res) => {
            try {
                const topScholarships = await scholarCollection.find({})
                    .sort({ applicationFees: 1, scholarshipPostDate: -1 })
                    .limit(6)
                    .toArray();

                res.send(topScholarships);
            } catch (error) {
                res.status(500).send({ message: 'Failed to load top scholarships' });
            }
        });

        app.get('/scholar/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await scholarCollection.findOne(query);
            res.send(result);
        });

        app.post('/scholar', verifyToken, async (req, res) => {
            const item = req.body;
            const result = await scholarCollection.insertOne(item);
            res.send(result);
        });

        app.patch('/scholar/:id', async (req, res) => {
            const id = req.params.id;
            const updates = req.body;

            const filter = { _id: new ObjectId(id) };
            const updateItem = {
                $set: {
                    scholarshipName: updates?.scholarshipName,
                    applicationDeadline: updates?.applicationDeadline,
                    applicationFees: updates?.applicationFees,
                    postedEmail: updates?.postedEmail,
                    scholarshipCategory: updates?.scholarshipCategory,
                    scholarshipPostDate: updates?.scholarshipPostDate,
                    serviceCharge: updates?.serviceCharge,
                    subjectCategory: updates?.subjectCategory,
                    tuitionFees: updates?.tuitionFees,
                    universityCity: updates?.universityCity,
                    universityCountry: updates?.universityCountry,
                    universityName: updates?.universityName,
                    universityRank: updates?.universityRank
                }
            };

            const result = await scholarCollection.updateOne(filter, updateItem);
            res.send(result);
        });


        app.delete('/scholar/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await scholarCollection.deleteOne(query);
            res.send(result);
        });

        // applied related api's
        app.get('/scholarApplied', verifyToken, async (req, res) => {
            const email = req.query.email;
            let query = {};

            if (email) {
                query = { userEmail: email };
            }

            try {
                const result = await appliedCollection.find(query).toArray();
                res.send(result);
            } catch {
                res.status(500).send({ message: 'Server error' });
            }
        });

        app.get('/scholarApplied/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            try {
                const doc = await appliedCollection.findOne(query);
                if (!doc) return res.status(404).send({ message: 'Not found.' });
                res.send(doc);
            } catch {
                res.status(500).send({ message: 'Server-side error.' });
            }
        });

        app.post('/scholarApplied', verifyToken, async (req, res) => {
            const item = req.body;
            try {
                const result = await appliedCollection.insertOne(item);
                res.send(result);
            } catch {
                res.status(500).send({ "message": "There is a server-side error!" })
            }
        });

        app.put('/scholarApplied/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            const updates = req.body;
            const filter = { _id: new ObjectId(id) };
            try {
                const result = await appliedCollection.updateOne(filter, { $set: updates });

                if (!result) {
                    return res.status(404).send({ message: 'Application not found.' });
                }

                res.send({ message: 'Application updated successfully.', result });
            } catch {
                res.status(500).send({ message: 'Server-side error.' });
            }
        });

        app.delete('/scholarApplied/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await appliedCollection.deleteOne(query);
            res.send(result);
        });


        // review related api's
        app.get('/reviews', async (req, res) => {
            const universityId = req.query.universityId;
            const email = req.query.email;

            let query = {};

            if (universityId) {
                query.universityId = universityId;
            }

            if (email) {
                query.userEmail = email;
            }

            try {
                const result = await reviewCollection.find(query).toArray();
                res.send(result);
            } catch {
                res.status(500).send({ message: 'Error fetching reviews' });
            }
        });

        app.post('/reviews', verifyToken, async (req, res) => {
            const item = req.body;
            const result = await reviewCollection.insertOne(item);
            res.send(result);
        });

        app.patch('/reviews/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const reviewData = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateReview = {
                $set: {
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    date: reviewData.date
                }
            };

            const result = await reviewCollection.updateOne(filter, updateReview);
            res.send(result);
        });


        app.delete('/reviews/:id', verifyToken, async (req, res) => {
            const reviewId = req.params.id;
            const query = { _id: new ObjectId(reviewId) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });


        // payment related api's
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.get('/payments/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { studentEmail: email };
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment);
            res.send(paymentResult);
        });

        // user dashboard stats
        app.get('/userDashboard/stats/:email', verifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden access' });
            }

            try {
                const applicationCount = await appliedCollection.countDocuments({ userEmail: email });
                const completedCount = await appliedCollection.countDocuments({
                    userEmail: email, applicationStatus: 'completed'
                });
                const processingCount = await appliedCollection.countDocuments({ userEmail: email, applicationStatus: 'processing' });
                const reviewCount = await reviewCollection.countDocuments({ userEmail: email });

                res.send({
                    totalApplications: applicationCount,
                    completed: completedCount,
                    processing: processingCount,
                    reviews: reviewCount
                });
            } catch (error) {
                res.status(500).send({ message: 'Failed to fetch dashboard stats' });
            }
        });

        // admin dashboard stats
        app.get('/admin-stats', verifyToken, async (req, res) => {
            try {
                const totalScholarships = await scholarCollection.estimatedDocumentCount();
                const totalReviews = await reviewCollection.estimatedDocumentCount();
                const applications = await appliedCollection.estimatedDocumentCount();
                const totalApplicants = await userCollection.countDocuments({ role: 'user' });

                res.send({
                    totalScholarships,
                    totalReviews,
                    applications,
                    totalApplicants
                });
            } catch (error) {
                res.status(500).send({ message: 'Server error while fetching stats.' });
            }
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Dream Scholar Hub');
});

app.listen(port, () => {
    console.log(`Server Running on Port: ${port}`);
})