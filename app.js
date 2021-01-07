const express= require('express');
const path = require('path');
const app= express();
const thirdPartyAPI= require('../Proyek-CC-V2/thirdPartyAPI');



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/1'));
app.use('/api',require('./routes/2'));
app.use('/api', require('./routes/3'));

app.get('/', async (req, res) => res.send("Online!"));
app.listen(process.env.PORT || 8080, () => console.log(`Server running`));
