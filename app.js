// app.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Sample user and seller data (replace with database integration)
let users = [];
let sellers = [];
let books = [];

// JWT Secret Key
const JWT_SECRET_KEY = 'your_secret_key';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// User Registration
app.post('/register/user', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if user with the same email already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { name, email, password: hashedPassword };
    users.push(user); // Save user data (replace with database integration)
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Seller Registration
app.post('/register/seller', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if seller with the same email already exists
    if (sellers.find(seller => seller.email === email)) {
      return res.status(400).json({ error: 'Seller with this email already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const seller = { name, email, password: hashedPassword };
    sellers.push(seller); // Save seller data (replace with database integration)
    res.status(201).json({ message: 'Seller registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// User Login
app.post('/login/user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ email: user.email }, JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Seller Login
app.post('/login/seller', async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = sellers.find(seller => seller.email === email);
    if (!seller) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, seller.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ email: seller.email }, JWT_SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CSV File Upload for Sellers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

app.post('/upload', authenticateToken, upload.single('csv'), (req, res) => {
  try {
    // Read CSV file
    const data = fs.readFileSync(req.file.path, 'utf-8').split('\n');
    // Process CSV data and save to database (replace with actual database integration)
    data.forEach(row => {
      const [title, author, price] = row.split(',');
      books.push({ title, author, price, seller: req.user.email });
    });
    // Delete uploaded file
    fs.unlinkSync(req.file.path);
    res.json({ message: 'CSV file uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all books for Users
app.get('/books', (req, res) => {
  try {
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get book details for Users
app.get('/books/:id', (req, res) => {
  try {
    const book = books.find(book => book.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
