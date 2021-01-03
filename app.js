const express= require('express');

const app= express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', require('./routes/jonsu'));
app.use('/api',require('./routes/gidion'));
app.use('/api', require('./routes/hubert'));

app.get('/', (req, res) => res.send('Online!'));

<<<<<<< HEAD
app.listen(process.env.PORT || 8080, () => console.log(`Server running`));
=======
app.listen(process.env.PORT || 3000, () => console.log(`Server running`));
>>>>>>> 5aae7e3ceeb5ca6f551baa5c4be86fc38a4c52c1
