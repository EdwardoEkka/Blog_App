const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');


const app = express();
const port = 3000; // Change this to the port you want to use

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/sign_in.html');
});

app.get('/sign_up', (req, res) => {
  res.sendFile(__dirname + '/sign_up.html');
});

app.get('/add_blogs', (req, res) => {
  res.sendFile(__dirname + '/add_blogs.html');
});


const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'return@12Apple',
  database: 'sign',
};

app.use(bodyParser.urlencoded({ extended: false }));
// First POST method for adding blogs
app.post('/add', (req, res) => {
  if (req.body.blog_name && req.body.blog_date && req.body.blog_content) {
 
    const uname=req.body.user_name;
    const dataToInsert = {

      blog_name: req.body.blog_name,
      blog_date: req.body.blog_date,
      blog_content: req.body.blog_content,
    };

    const connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database: ' + err.message);
        return;
      }

      const insertQuery = `INSERT INTO ${uname} SET ?`;

      connection.query(insertQuery, dataToInsert, (err, results) => {
        if (err) {
          console.error('Error inserting data into the table: ' + err.message);
        } else {
          console.log('Data inserted into the table.');
        }

        connection.end();
        res.redirect(`/feed?username=${uname}`);
      });
    });
  }
});

// Second POST method for adding user details
app.post('/insert', (req, res) => {
  if (req.body.username1 && req.body.password1) {
    const dataToInsert = {
      username: req.body.username1,
      password: req.body.password1,
    };

    const uname = req.body.username1;
    const tableName = 'details';

    const connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to the database: ' + err.message);
        return;
      }

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${uname} (
          blog_id INT AUTO_INCREMENT PRIMARY KEY,
          blog_name VARCHAR(255),
          blog_date DATE,
          blog_content TEXT
        )
      `;

      connection.query(createTableQuery, (err, results) => {
        if (err) {
          console.error('Error creating the table: ' + err.message);
          connection.end();
          return;
        }

        console.log(`Table ${tableName} created successfully.`);

        const insertQuery = `INSERT INTO ${tableName} SET ?`;

        connection.query(insertQuery, dataToInsert, (err, results) => {
          if (err) {
            console.error('Error inserting data into the table: ' + err.message);
          } else {
            console.log(`Data inserted into ${tableName} table.`);
          }

          connection.end();
          res.redirect('/');
        });
      });
    });
  }
});



// Handle login validation
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const tableName = 'details';
  
  const connection = mysql.createConnection(dbConfig);
  
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ' + err.message);
      return;
    }
    
    const selectQuery = `SELECT * FROM ${tableName} WHERE username = ? AND password = ?`;
    
    connection.query(selectQuery, [username, password], (err, results) => {
      if (err) {
        console.error('Error querying the database: ' + err.message);
      } else {
        if (results.length > 0) {
          // User found in the database
          res.redirect('/feed?username=' + username);
        } else {
          // User not found in the database
          res.status(200).send('Login failed');
        }
      }
      
      connection.end(); // Close the database connection after the query
    });
  });
});

app.get('/feed', (req, res) => {
  const connection = mysql.createConnection(dbConfig);

  const username = req.query.username;

  if (!username) {
    res.status(400).send('Username not provided in the URL.');
    return;
  }

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ' + err.message);
      res.status(500).send('Error connecting to the database');
      return;
    }

    const query = `SELECT * FROM ${username}`;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Error fetching data');
        connection.end();
        return;
      }

      if (results.length === 0) {
        // If no data is returned, you can generate a message for an empty table.
        const feed = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Table Display</title>
            <style>
              body {
                font-family: Arial, sans-serif;
              }
              p {
                font-size: 18px;
                color: #333;
              }
              a {
                text-decoration: none;
                color: #007bff;
              }
            </style>
          </head>
          <body>
            <p>Database is empty for username: ${username}</p>
            <a href="/add_blogs?username=${username}">Click here to add more blogs.</a>
          </body>
          </html>
        `;
        res.send(feed);
      } else {
        const columns = Object.keys(results[0]);

        const tableRows = results.map(row => {
          const rowHtml = columns.map(columnName => {
            return `<td>${row[columnName]}</td>`;
          }).join('');
          return `<tr>${rowHtml}</tr>`;
        });

        const feed = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Table Display</title>
            <style>
              table {
                width: 100%;
              }
              table, th, td {
                border: 1px solid #333;
              }
              th, td {
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #333;
                color: #fff;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
              }
              tr:hover {
                background-color: #ddd;
              }
            </style>
          </head>
          <body>
            <table>
              <thead>
                <tr>
                  ${columns.map(columnName => `<th>${columnName}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows.join('')}
              </tbody>
            </table>
            <a href="/add_blogs?username=${username}">Click here to add more blogs.</a>
          </body>
          </html>
        `;
        res.send(feed);
      }

      connection.end();
    });
  });
});





app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
