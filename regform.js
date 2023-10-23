const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000; // Set your desired port number
const bcrypt = require('bcrypt'); // Import the bcrypt library

// Middleware to parse POST data
app.use(express.urlencoded({ extended: false }));

// Serve static files, e.g., your CSS and client-side JavaScript
app.use(express.static('public'));

// PostgreSQL database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Homify',
    password: 'Atheeq',
    port: 5432, // Change the port if your PostgreSQL server uses a different port
});

// Define a route to serve the registration form
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.get('/success', (req, res) => {
    res.sendFile(__dirname + '/success.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/reset-password', (req, res) => {
    res.sendFile(__dirname + '/reset-password.html');
});

app.get('/dashboard', (req, res) => {
    // Render the dashboard page or serve the dashboard HTML here
    res.sendFile(__dirname + '/dashboard.html');
});

app.get('/reset-success', (req, res) => {
    res.sendFile(__dirname + '/reset-success.html');
});



// Define a route to render the logout success page
app.get('/logout', (req, res) => {
    res.sendFile(__dirname + '/logout.html');
});


// Define a route to handle registration form submissions
app.post('/register', async (req, res) => {
    const { name, age, relation, username, password } = req.body;

    // Hash the user's password before storing it in the database
    const saltRounds = 10; // Adjust the number of salt rounds as needed
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Now, insert the hashed password into the database
    const insertQuery = 'INSERT INTO fam_members (name, age, relation, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const insertValues = [name, age, relation, username, hashedPassword];

    try {
        const result = await pool.query(insertQuery, insertValues);
        console.log('Registered with ID:', result.rows[0].id);

        // Redirect to the success page or another page
        res.redirect('/success');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during registration.');
    }
});



// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Fetch user data from the database based on the provided username
    const query = 'SELECT * FROM fam_members WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 1) {
            // User with the provided username exists

            const user = result.rows[0];

            // Compare the provided password with the hashed password from the database
            if (await bcrypt.compare(password, user.password)) {
                // Passwords match, user is authenticated

                // Redirect to the dashboard or another page
                res.redirect('/dashboard');
            } else {
                // Passwords do not match, show an error message
                res.status(401).send('Incorrect username or password');
            }
        } else {
            // No user found with the provided username, show an error message
            res.status(401).send('Incorrect username or password');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during login.');
    }
});

app.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    // Request validation checks
    if (!username || !newPassword) {
        return res.status(400).send('Both username and new password are required.');
    }

    // Implement additional validation checks as needed
    if (newPassword.length < 8) {
        return res.status(400).send('New password must be at least 8 characters long.');
    }

    // Generate a secure password hash using bcrypt
    const saltRounds = 10; // Adjust the number of salt rounds according to your security requirements
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password in the database
    const updateQuery = 'UPDATE fam_members SET password = $1 WHERE username = $2';
    const updateValues = [hashedPassword, username];

    try {
        await pool.query(updateQuery, updateValues);
        res.redirect('/reset-success'); // You can redirect to a confirmation page instead.
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during password reset.');
    }
});

// Define a route to handle the POST request for logout
app.post('/logout', (req, res) => {
    // Perform logout actions here, such as clearing the user's session
    // Example: req.session.destroy(); // If you are using express-session for session management

    // Redirect to the logout success page
    res.redirect('/logout');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
