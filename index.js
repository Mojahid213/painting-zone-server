const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5050;
app.use(cors());
require('dotenv').config();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const objectID = require('mongodb').ObjectID;


app.get('/', (req, res) => {
  res.send('Hello World!')
})


// firebase JWT token varification initialization
const admin = require("firebase-admin");
const serviceAccount = require("./AuthKey/painting-zone-firebase-adminsdk-k2q80-19480eece6.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://painting-zone.firebaseio.com'
});



const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dbk4b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  //......Booking-Collection
  const bookCollection = client.db("paintingZone").collection("userBookings");

  app.post("/addBookings", (req, res) => {
    const bookings = req.body;
    bookCollection.insertOne(bookings)
      .then(result => {
        console.log("bookings added =", result.insertedCount);
      })
  })
  app.get("/getBookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          if (decodedToken.email == req.query.email) {
            bookCollection.find({ email: req.query.email })
              .toArray((err, documents) => {
                res.send(documents)
              })
          }else{
            res.status(401).send('un-authorized access')
          }
        })
        .catch((error) => {
          // Handle error
        });
    }else{
      res.status(401).send('un-authorized access')
    }

  })

  app.get("/getOrders", (req, res) => {
    bookCollection.find({})
      .toArray((err, orders) => {
        res.send(orders)
      })
  })


  //.......Reviews-Collection
  const reviewCollection = client.db("paintingZone").collection("reviews");
  app.post("/postReview", (req, res) => {
    const theReviews = req.body;
    reviewCollection.insertOne(theReviews)
      .then(result => {
        console.log("reviews added =", result.insertedCount);
      })
  })

  app.get('/getTestimonial', (req, res) => {
    reviewCollection.find({})
      .toArray((err, reviews) => {
        res.send(reviews);
      })
  })

  //Services collection
  const serviceCollection = client.db("paintingZone").collection("services");
  app.post("/addnewservice", (req, res) => {
    const addService = req.body;
    serviceCollection.insertOne(addService)
      .then(result => {
        console.log("service added=", result.insertedCount);
      })
  })

  app.get("/getServices", (req, res) => {
    serviceCollection.find({})
      .toArray((err, services) => {
        res.send(services)
      })
  })

  app.delete("/deleteServices/:id", (req, res) => {
    const id = objectID(req.params.id);
    serviceCollection.deleteOne({ _id: id })
      .then(result => {
        console.log("deleted =", result.deletedCount);
      })
  })


});


app.listen(port, () => {
  console.log('port 5050 started')
})