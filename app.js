import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser'
import userRoutes from './routes/user.routes.js'
import courseRouter from "./routes/course.routes.js"
import paymentRouter from './routes/payment.routes.js'
import errorMiddleware from './middleware/error.middleware.js'
import morgan from 'morgan';

const app = express();

app.use(express.json());

// cookie parder
app.use(cookieParser())

// for cors
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}))

app.use(morgan('dev'));


app.use('/ping',(req,res)=>{
    res.send("Pong")
})


// 3 routes config 
app.use('/api/v1/user',userRoutes);
app.use('/api/v1/courses',courseRouter)
app.use('/api/v1/payments',paymentRouter)

app.use("*",(req,res)=>{
  res.status(400).send("OOPS!! 400 Page Not Found")
})


app.use(errorMiddleware)

export default app;