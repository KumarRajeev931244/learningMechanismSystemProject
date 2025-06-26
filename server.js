import app from "./app.js";
import connectionDB from 'dbconnection.js'

const PORT = process.env.PORT || 5000;
app.listen(PORT, async() => {
    await connectionDB()
    console.log(`app is running at PORT:${PORT}`);
})