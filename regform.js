const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000; // Set your desired port number
const bcrypt = require('bcrypt'); // Import the bcrypt library

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Homify',
    password: 'Atheeq',
    port: 5432,
});

// Define routes for serving pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

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

app.get('/addtask', (req, res) => {
    // Render the add task page or serve the HTML for the add task form
    res.sendFile(__dirname + '/addtask.html');
});

app.get('/tasks', (req, res) => {
    const userId = 14; // Replace with the actual user ID or method of user identification

    // Fetch the username from the database
    const query = 'SELECT username FROM fam_members WHERE id = $1';
    const values = [userId];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching username.');
        }

        const username = result.rows[0].username;

        // Now, render the tasks page and pass the username to the view
        res.render('tasks', { username: username, userTasks: [] });
    });
});


app.get('/reset-success', (req, res) => {
    res.sendFile(__dirname + '/reset-success.html');
});

app.get('/logout', (req, res) => {
    res.sendFile(__dirname + '/logout.html');
});

// Define a route to fetch the username
app.get('/get-username', (req, res) => {
    const userId = 14; // Replace with the actual user ID or method of user identification

    const query = 'SELECT username FROM fam_members WHERE id = $1';
    const values = [userId];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching username.');
        }

        const username = result.rows[0].username;
        res.send(username);
    });
});

app.post('/register', async (req, res) => {
    const { name, age, relation, username, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery = 'INSERT INTO fam_members (name, age, relation, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING id';
    const insertValues = [name, age, relation, username, hashedPassword];

    try {
        const result = await pool.query(insertQuery, insertValues);
        const userId = result.rows[0].id;

        const fetchUsernameQuery = 'SELECT username FROM fam_members WHERE id = $1';
        const fetchUsernameValues = [userId];

        const usernameResult = await pool.query(fetchUsernameQuery, fetchUsernameValues);
        const username = usernameResult.rows[0].username;

        res.redirect(`/success?username=${username}`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during registration.');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM fam_members WHERE username = $1';
    const values = [username];

    try {
        const result = await pool.query(query, values);

        if (result.rows.length === 1) {
            const user = result.rows[0];

            if (await bcrypt.compare(password, user.password)) {
                res.redirect('/tasks');
            } else {
                res.redirect('/login?error=true');
            }
        } else {
            res.redirect('/login?error=true');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during login.');
    }
});

app.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).send('Both username and new password are required.');
    }

    if (newPassword.length < 8) {
        return res.status(400).send('New password must be at least 8 characters long.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updateQuery = 'UPDATE fam_members SET password = $1 WHERE username = $2';
    const updateValues = [hashedPassword, username];

    try {
        await pool.query(updateQuery, updateValues);
        res.redirect('/reset-success');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during password reset.');
    }
});

app.post('/logout', (req, res) => {
    res.redirect('/logout');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
