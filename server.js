import 'dotenv/config'
import app from "./app.js";
import connectToDb from "./src/config/db.js";


await connectToDb();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});