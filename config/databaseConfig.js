import mongoose from "mongoose";


const connectToDB = async () =>{
    try {
        const {connection} = await mongoose.connect(
            process.env.MONGODB_URL || `mongodb://127.0.0.1:27017/lms`
        );

        if(connection){
            console.log(`Connected to Mongodb ${connection.host}`)
        }
    } catch (error) {
        console.log(e)
        process.exit(1)
    }
}

export default connectToDB