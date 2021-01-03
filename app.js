const express= require('express');

const app= express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', require('./routes/jonsu'));
app.use('/api',require('./routes/gidion'));
app.use('/api', require('./routes/hubert'));

app.get('/', (req, res) => res.send('Online!'));

app.listen(process.env.PORT || 8080, () => console.log(`Server running`));
