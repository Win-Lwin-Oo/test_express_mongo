const express = require('express');
const app = express();

app.get('/api/peoples', function (req, res) {
    const data = [
        { name: "Bobo", age: 22 },
        { name: "Nini", age: 23 },
    ];
    return res.status(200).json(data);
});

app.listen(8080, function () {
    console.log('Server is running at port 8080.....');
})